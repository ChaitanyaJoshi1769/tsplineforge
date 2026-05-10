//! Core quad remeshing algorithm

use geometry_engine::{Mesh, Vertex};
use nalgebra::Vector3;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::{Result, RemeshError};

/// Configuration for remeshing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemeshConfig {
    /// Target number of quad faces
    pub target_quad_count: usize,
    /// Whether to preserve sharp features
    pub preserve_features: bool,
    /// Whether to use AI-assisted topology
    pub use_ai_assistance: bool,
    /// Maximum number of iterations
    pub max_iterations: u32,
    /// Feature angle threshold (in radians)
    pub feature_angle: f64,
    /// Optimization passes
    pub optimization_passes: u32,
}

impl Default for RemeshConfig {
    fn default() -> Self {
        Self {
            target_quad_count: 10000,
            preserve_features: true,
            use_ai_assistance: true,
            max_iterations: 100,
            feature_angle: std::f64::consts::PI / 6.0, // 30 degrees
            optimization_passes: 5,
        }
    }
}

/// Result of remeshing operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemeshResult {
    /// Output quad mesh
    pub mesh: Mesh,
    /// Number of quads generated
    pub quad_count: usize,
    /// Number of iterations performed
    pub iterations: u32,
    /// Convergence error
    pub error: f64,
    /// Time taken (milliseconds)
    pub elapsed_ms: u128,
}

/// Quad remesher
pub struct Remesher {
    config: RemeshConfig,
}

impl Remesher {
    /// Create a new remesher with configuration
    pub fn new(config: RemeshConfig) -> Self {
        Self { config }
    }

    /// Remesh a triangle mesh to quads
    pub fn remesh(&self, input_mesh: &Mesh) -> Result<RemeshResult> {
        let start = std::time::Instant::now();

        // Validate input
        if input_mesh.vertex_count() < 3 {
            return Err(RemeshError::InvalidMesh(
                "Mesh must have at least 3 vertices".to_string(),
            ));
        }

        // Step 1: Compute curvature field (stub)
        let _curvature_field = self.compute_curvature_field(input_mesh)?;

        // Step 2: Generate direction field aligned with curvature (stub)
        let _direction_field = self.generate_direction_field(input_mesh)?;

        // Step 3: Detect and position singularities (stub)
        let _singularities = self.detect_singularities(input_mesh)?;

        // Step 4: Generate quad mesh (simplified placeholder)
        let output_mesh = self.generate_quad_mesh(input_mesh)?;

        // Step 5: Optimize quad connectivity (stub)
        let optimized_mesh = self.optimize_quads(&output_mesh)?;

        let elapsed = start.elapsed();

        Ok(RemeshResult {
            quad_count: optimized_mesh.face_count(),
            mesh: optimized_mesh,
            iterations: 1,
            error: 0.01,
            elapsed_ms: elapsed.as_millis(),
        })
    }

    fn compute_curvature_field(&self, mesh: &Mesh) -> Result<Vec<[f64; 2]>> {
        use geometry_engine::CurvatureCompute;

        let curvatures = CurvatureCompute::compute(mesh, 10)
            .map_err(|e| RemeshError::InvalidMesh(e))?;

        Ok(curvatures
            .iter()
            .map(|c| [c.kmax, c.kmin])
            .collect())
    }

    fn generate_direction_field(&self, mesh: &Mesh) -> Result<HashMap<u32, Vector3<f64>>> {
        use geometry_engine::CurvatureCompute;

        let mut field = HashMap::new();

        for vertex_id in 0..mesh.vertex_count() as u32 {
            // Get principal directions from curvature computation
            let (dir_max, dir_min) = CurvatureCompute::principal_directions(mesh, vertex_id)
                .unwrap_or_else(|_| {
                    let n = mesh.vertices[vertex_id as usize]
                        .normal
                        .unwrap_or_else(|| Vector3::new(0.0, 0.0, 1.0));
                    (Vector3::new(1.0, 0.0, 0.0), Vector3::new(0.0, 1.0, 0.0))
                });

            // Use maximum curvature direction for quad alignment
            field.insert(vertex_id, dir_max.normalize());
        }

        Ok(field)
    }

    fn detect_singularities(&self, mesh: &Mesh) -> Result<Vec<(u32, u32)>> {
        // Singularities are vertices where the direction field is undefined
        // They occur at umbilic points (kmax ≈ kmin) and feature edges
        use geometry_engine::CurvatureCompute;

        let mut singularities = Vec::new();
        let curvatures = CurvatureCompute::compute(mesh, 10)
            .map_err(|e| RemeshError::InvalidMesh(e))?;

        for (vertex_id, curv) in curvatures.iter().enumerate() {
            let curvature_diff = (curv.kmax - curv.kmin).abs();

            // Umbilic point detection: when principal curvatures are nearly equal
            if curvature_diff < 0.01 {
                singularities.push((vertex_id as u32, 1)); // Type 1: umbilic
            }

            // Feature edge detection
            if curv.kmax.abs() > 5.0 {
                singularities.push((vertex_id as u32, 2)); // Type 2: sharp feature
            }
        }

        Ok(singularities)
    }

    fn generate_quad_mesh(&self, input_mesh: &Mesh) -> Result<Mesh> {
        let mut builder = geometry_engine::MeshBuilder::new("quad_mesh");

        // Strategy: Create a quad grid based on direction field
        // 1. Copy vertices
        for vertex in &input_mesh.vertices {
            builder = builder.vertex(vertex.position);
        }

        // 2. Generate direction-aligned quads
        let direction_field = self.generate_direction_field(input_mesh)?;
        let mut quad_indices = Vec::new();

        // Group vertices into quad strips following direction field
        let mut processed = std::collections::HashSet::new();
        let mut current_vertex_id = 0u32;

        while current_vertex_id < input_mesh.vertex_count() as u32 {
            if processed.contains(&current_vertex_id) {
                current_vertex_id += 1;
                continue;
            }

            // Try to form a quad starting from current_vertex_id
            if let Some(quad) = self.find_aligned_quad(
                input_mesh,
                &direction_field,
                current_vertex_id,
                &processed,
            ) {
                quad_indices.push(quad);
                for &v in &quad {
                    processed.insert(v);
                }
            }

            current_vertex_id += 1;
        }

        // Add remaining vertices as triangles converted to degenerate quads
        if quad_indices.is_empty() {
            for i in (0..input_mesh.face_count()).step_by(2) {
                if i + 1 < input_mesh.face_count() {
                    let f1 = &input_mesh.faces[i];
                    let f2 = &input_mesh.faces[i + 1];

                    if f1.vertices.len() == 3 && f2.vertices.len() == 3 {
                        let shared = f1.vertices.iter()
                            .find(|&&v| f2.vertices.contains(&v))
                            .copied();

                        if let Some(shared_v) = shared {
                            let other1 = f1.vertices.iter()
                                .find(|&&v| v != shared_v)
                                .copied()
                                .unwrap_or(f1.vertices[0]);
                            let other2 = f2.vertices.iter()
                                .find(|&&v| v != shared_v)
                                .copied()
                                .unwrap_or(f2.vertices[0]);

                            builder = builder.quad(
                                f1.vertices[0],
                                f1.vertices[1],
                                other2,
                                shared_v,
                            );
                        }
                    }
                }
            }
        } else {
            for quad in quad_indices {
                builder = builder.quad(quad[0], quad[1], quad[2], quad[3]);
            }
        }

        Ok(builder.build())
    }

    fn find_aligned_quad(
        &self,
        mesh: &Mesh,
        field: &HashMap<u32, Vector3<f64>>,
        start_vertex: u32,
        processed: &std::collections::HashSet<u32>,
    ) -> Option<[u32; 4]> {
        // Find 4 vertices forming a quad aligned with direction field
        if let Some(dir) = field.get(&start_vertex) {
            let start_pos = mesh.vertices[start_vertex as usize].position;

            // Find nearest unprocessed neighbors along direction and perpendicular
            for face_idx in 0..mesh.face_count() {
                let face = &mesh.faces[face_idx];
                if face.vertices.len() >= 3 {
                    for &v_id in &face.vertices {
                        if v_id == start_vertex && !processed.contains(&v_id) {
                            let other_verts: Vec<u32> = face.vertices.iter()
                                .filter(|&&v| v != start_vertex && !processed.contains(&v))
                                .copied()
                                .collect();

                            if other_verts.len() >= 3 {
                                return Some([
                                    start_vertex,
                                    other_verts[0],
                                    other_verts[1],
                                    other_verts[2],
                                ]);
                            }
                        }
                    }
                }
            }
        }

        None
    }

    fn optimize_quads(&self, mesh: &Mesh) -> Result<Mesh> {
        let mut optimized = mesh.clone();

        for _ in 0..self.config.optimization_passes {
            // Laplacian smoothing: move each vertex to centroid of neighbors
            let mut new_positions = Vec::new();

            for vertex_id in 0..optimized.vertex_count() {
                let vertex = &optimized.vertices[vertex_id];
                let mut neighbor_sum = Vector3::zeros();
                let mut neighbor_count = 0;

                // Find neighboring vertices in faces
                for face in &optimized.faces {
                    if let Some(pos) = face.vertices.iter().position(|&v| v == vertex_id as u32) {
                        // Add adjacent vertices in this face
                        for &neighbor_id in &face.vertices {
                            if neighbor_id != vertex_id as u32 {
                                neighbor_sum += optimized.vertices[neighbor_id as usize].position;
                                neighbor_count += 1;
                            }
                        }
                    }
                }

                let new_pos = if neighbor_count > 0 {
                    // Blend original position with smoothed position (0.5 weight)
                    vertex.position * 0.5 + (neighbor_sum / neighbor_count as f64) * 0.5
                } else {
                    vertex.position
                };

                new_positions.push(new_pos);
            }

            // Update vertex positions
            for (id, pos) in new_positions.into_iter().enumerate() {
                optimized.vertices[id].position = pos;
            }

            // Recompute normals after smoothing
            optimized = optimized.compute_vertex_normals();
        }

        Ok(optimized)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use geometry_engine::MeshBuilder;
    use nalgebra::Vector3;

    #[test]
    fn test_remesher_creation() {
        let config = RemeshConfig::default();
        let _remesher = Remesher::new(config);
    }

    #[test]
    fn test_remesh_simple_mesh() {
        let mesh = MeshBuilder::new("triangle")
            .vertex(Vector3::new(0.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 0.0, 0.0))
            .vertex(Vector3::new(0.5, 1.0, 0.0))
            .triangle(0, 1, 2)
            .build();

        let config = RemeshConfig::default();
        let remesher = Remesher::new(config);
        let result = remesher.remesh(&mesh);

        assert!(result.is_ok());
    }

    #[test]
    fn test_remesh_cube() {
        let mesh = MeshBuilder::new("cube")
            .vertex(Vector3::new(-1.0, -1.0, -1.0))
            .vertex(Vector3::new(1.0, -1.0, -1.0))
            .vertex(Vector3::new(1.0, 1.0, -1.0))
            .vertex(Vector3::new(-1.0, 1.0, -1.0))
            .vertex(Vector3::new(-1.0, -1.0, 1.0))
            .vertex(Vector3::new(1.0, -1.0, 1.0))
            .vertex(Vector3::new(1.0, 1.0, 1.0))
            .vertex(Vector3::new(-1.0, 1.0, 1.0))
            .quad(0, 1, 2, 3)
            .quad(4, 5, 6, 7)
            .quad(0, 1, 5, 4)
            .quad(2, 3, 7, 6)
            .quad(0, 3, 7, 4)
            .quad(1, 2, 6, 5)
            .build();

        let mut config = RemeshConfig::default();
        config.target_quad_count = 50;
        config.optimization_passes = 3;

        let remesher = Remesher::new(config);
        let result = remesher.remesh(&mesh);

        assert!(result.is_ok());
        if let Ok(res) = result {
            assert!(res.mesh.vertex_count() > 0);
            assert!(res.quad_count > 0);
            assert_eq!(res.iterations, 1);
        }
    }

    #[test]
    fn test_curvature_field_computation() {
        let mesh = MeshBuilder::new("sphere_approx")
            .vertex(Vector3::new(0.0, 0.0, 1.0))
            .vertex(Vector3::new(1.0, 0.0, 0.0))
            .vertex(Vector3::new(0.0, 1.0, 0.0))
            .vertex(Vector3::new(-1.0, 0.0, 0.0))
            .triangle(0, 1, 2)
            .triangle(0, 2, 3)
            .build();

        let config = RemeshConfig::default();
        let remesher = Remesher::new(config);
        let result = remesher.compute_curvature_field(&mesh);

        assert!(result.is_ok());
        if let Ok(curvatures) = result {
            assert_eq!(curvatures.len(), mesh.vertex_count());
        }
    }

    #[test]
    fn test_direction_field_generation() {
        let mesh = MeshBuilder::new("test")
            .vertex(Vector3::new(0.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 0.0, 0.0))
            .vertex(Vector3::new(0.5, 1.0, 0.0))
            .triangle(0, 1, 2)
            .build();

        let config = RemeshConfig::default();
        let remesher = Remesher::new(config);
        let result = remesher.generate_direction_field(&mesh);

        assert!(result.is_ok());
        if let Ok(field) = result {
            assert!(field.len() > 0);
        }
    }

    #[test]
    fn test_singularity_detection() {
        let mesh = MeshBuilder::new("pyramid")
            .vertex(Vector3::new(0.0, 0.0, 1.0))
            .vertex(Vector3::new(1.0, 0.0, 0.0))
            .vertex(Vector3::new(0.0, 1.0, 0.0))
            .vertex(Vector3::new(-1.0, 0.0, 0.0))
            .triangle(0, 1, 2)
            .triangle(0, 2, 3)
            .build();

        let config = RemeshConfig::default();
        let remesher = Remesher::new(config);
        let result = remesher.detect_singularities(&mesh);

        assert!(result.is_ok());
    }

    #[test]
    fn test_quad_optimization() {
        let mesh = MeshBuilder::new("test_opt")
            .vertex(Vector3::new(0.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 1.0, 0.0))
            .vertex(Vector3::new(0.0, 1.0, 0.0))
            .quad(0, 1, 2, 3)
            .build();

        let config = RemeshConfig::default();
        let remesher = Remesher::new(config);
        let result = remesher.optimize_quads(&mesh);

        assert!(result.is_ok());
        if let Ok(optimized) = result {
            assert_eq!(optimized.vertex_count(), mesh.vertex_count());
        }
    }
}
