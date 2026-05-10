//! Mesh validation and error detection

use crate::mesh::{Edge, Mesh};
use crate::topology::HalfEdgeTopology;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

/// Validation issues found in a mesh
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationIssue {
    /// Non-manifold edge (more than 2 adjacent faces)
    NonManifoldEdge { v0: u32, v1: u32 },
    /// Degenerate triangle (zero area)
    DegenerateTriangle { face_id: u32 },
    /// Duplicate vertex (within epsilon)
    DuplicateVertex { v0: u32, v1: u32, distance: f64 },
    /// Self-intersection detected
    SelfIntersection { face_id: u32 },
    /// Flipped normal (inconsistent winding)
    FlippedNormal { face_id: u32 },
    /// Open boundary (non-closed mesh)
    OpenBoundary { edge_count: usize },
    /// Disconnected components
    DisconnectedComponent { component_id: usize, vertex_count: usize },
    /// Inconsistent normal (not normalized)
    InconsistentNormal { vertex_id: u32 },
}

/// Validation report for a mesh
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationReport {
    /// Mesh ID
    pub mesh_id: String,
    /// Whether mesh is valid
    pub is_valid: bool,
    /// Severity level (0-3: info, warning, error, critical)
    pub severity: u32,
    /// Issues found
    pub issues: Vec<ValidationIssue>,
    /// Suggestions for repair
    pub suggestions: Vec<String>,
}

/// Mesh validator
pub struct MeshValidator {
    epsilon: f64,
}

impl MeshValidator {
    /// Create a new validator
    pub fn new(epsilon: f64) -> Self {
        Self { epsilon }
    }

    /// Validate a mesh
    pub fn validate(&self, mesh: &Mesh) -> ValidationReport {
        let mut issues = Vec::new();
        let mut suggestions = Vec::new();

        // Check for empty mesh
        if mesh.vertex_count() == 0 || mesh.face_count() == 0 {
            issues.push(ValidationIssue::OpenBoundary { edge_count: 0 });
            suggestions.push("Mesh is empty".to_string());
            return ValidationReport {
                mesh_id: mesh.id.to_string(),
                is_valid: false,
                severity: 3,
                issues,
                suggestions,
            };
        }

        // Check for duplicate vertices
        self.check_duplicate_vertices(mesh, &mut issues, &mut suggestions);

        // Check for degenerate faces
        self.check_degenerate_faces(mesh, &mut issues, &mut suggestions);

        // Check for non-manifold topology
        if let Ok(topo) = HalfEdgeTopology::from_mesh(mesh) {
            self.check_non_manifold(&topo, mesh, &mut issues, &mut suggestions);

            // Check if closed
            if !topo.is_closed() {
                issues.push(ValidationIssue::OpenBoundary {
                    edge_count: topo.boundary_edges().len(),
                });
                suggestions.push("Mesh has open boundaries - consider closing or sealing".to_string());
            }

            // Check disconnected components
            self.check_disconnected_components(&topo, &mut issues, &mut suggestions);
        }

        // Check normal consistency
        self.check_normal_consistency(mesh, &mut issues, &mut suggestions);

        let severity = if issues.is_empty() { 0 } else { issues.len().min(3) as u32 + 1 };
        let is_valid = severity < 2;

        ValidationReport {
            mesh_id: mesh.id.to_string(),
            is_valid,
            severity,
            issues,
            suggestions,
        }
    }

    fn check_duplicate_vertices(
        &self,
        mesh: &Mesh,
        issues: &mut Vec<ValidationIssue>,
        suggestions: &mut Vec<String>,
    ) {
        for i in 0..mesh.vertex_count() {
            for j in (i + 1)..mesh.vertex_count() {
                let dist = (mesh.vertices[i].position - mesh.vertices[j].position).norm();
                if dist < self.epsilon {
                    issues.push(ValidationIssue::DuplicateVertex {
                        v0: i as u32,
                        v1: j as u32,
                        distance: dist,
                    });
                }
            }
        }

        if !issues.is_empty() {
            suggestions.push("Remove duplicate vertices using 'merge vertices'".to_string());
        }
    }

    fn check_degenerate_faces(
        &self,
        mesh: &Mesh,
        issues: &mut Vec<ValidationIssue>,
        suggestions: &mut Vec<String>,
    ) {
        for face in &mesh.faces {
            if face.vertices.len() < 3 {
                issues.push(ValidationIssue::DegenerateTriangle { face_id: face.id });
                continue;
            }

            let p0 = mesh.vertices[face.vertices[0] as usize].position;
            let p1 = mesh.vertices[face.vertices[1] as usize].position;
            let p2 = mesh.vertices[face.vertices[2] as usize].position;

            let area = (p1 - p0).cross(&(p2 - p0)).norm() / 2.0;

            if area < self.epsilon {
                issues.push(ValidationIssue::DegenerateTriangle { face_id: face.id });
            }
        }

        if !issues.is_empty() {
            suggestions.push("Delete degenerate faces or merge colinear vertices".to_string());
        }
    }

    fn check_non_manifold(
        &self,
        topo: &HalfEdgeTopology,
        _mesh: &Mesh,
        issues: &mut Vec<ValidationIssue>,
        suggestions: &mut Vec<String>,
    ) {
        let non_manifold = topo.non_manifold_vertices();
        if !non_manifold.is_empty() {
            for v in non_manifold {
                let edges = topo.vertex_edges(v);
                if edges.len() > topo.adjacent_vertices(v).len() {
                    issues.push(ValidationIssue::NonManifoldEdge {
                        v0: v,
                        v1: topo.adjacent_vertices(v)[0],
                    });
                }
            }
            suggestions.push("Repair non-manifold vertices using 'fix topology'".to_string());
        }
    }

    fn check_disconnected_components(
        &self,
        topo: &HalfEdgeTopology,
        issues: &mut Vec<ValidationIssue>,
        suggestions: &mut Vec<String>,
    ) {
        let mut visited = vec![false; topo.num_vertices as usize];
        let mut components = 0;

        for start in 0..topo.num_vertices {
            if visited[start as usize] {
                continue;
            }

            let mut queue = vec![start];
            let mut component_size = 0;

            while let Some(v) = queue.pop() {
                if visited[v as usize] {
                    continue;
                }
                visited[v as usize] = true;
                component_size += 1;

                for &adj in &topo.adjacent_vertices(v) {
                    if !visited[adj as usize] {
                        queue.push(adj);
                    }
                }
            }

            if component_size > 0 {
                components += 1;
                if components > 1 {
                    issues.push(ValidationIssue::DisconnectedComponent {
                        component_id: components - 1,
                        vertex_count: component_size,
                    });
                }
            }
        }

        if components > 1 {
            suggestions.push(format!("Mesh has {} disconnected components - consider joining or separating", components));
        }
    }

    fn check_normal_consistency(
        &self,
        mesh: &Mesh,
        issues: &mut Vec<ValidationIssue>,
        _suggestions: &mut Vec<String>,
    ) {
        for vertex in &mesh.vertices {
            if let Some(normal) = vertex.normal {
                if (normal.norm() - 1.0).abs() > self.epsilon {
                    issues.push(ValidationIssue::InconsistentNormal {
                        vertex_id: vertex.id,
                    });
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mesh::MeshBuilder;
    use nalgebra::Vector3;

    #[test]
    fn test_validate_good_mesh() {
        let mesh = MeshBuilder::new("triangle")
            .vertex(Vector3::new(0.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 0.0, 0.0))
            .vertex(Vector3::new(0.5, 1.0, 0.0))
            .triangle(0, 1, 2)
            .build();

        let validator = MeshValidator::new(1e-10);
        let report = validator.validate(&mesh);

        assert!(report.is_valid);
    }

    #[test]
    fn test_detect_degenerate_face() {
        let mesh = MeshBuilder::new("degenerate")
            .vertex(Vector3::new(0.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 0.0, 0.0))
            .vertex(Vector3::new(2.0, 0.0, 0.0))
            .triangle(0, 1, 2)
            .build();

        let validator = MeshValidator::new(1e-10);
        let report = validator.validate(&mesh);

        assert!(!report.is_valid);
        assert!(report.issues.iter().any(|issue| matches!(issue, ValidationIssue::DegenerateTriangle { .. })));
    }
}
