//! T-mesh data structure for T-Spline surfaces

use nalgebra::Vector3;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A T-vertex (control point) in the T-mesh
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TVertex {
    /// Unique vertex ID
    pub id: u32,
    /// 3D control point position
    pub position: Vector3<f64>,
    /// Weight (for rational T-Splines)
    pub weight: f64,
    /// Refinement level
    pub level: u32,
}

impl TVertex {
    /// Create a new T-vertex
    pub fn new(id: u32, position: Vector3<f64>) -> Self {
        Self {
            id,
            position,
            weight: 1.0,
            level: 0,
        }
    }

    /// Create a weighted T-vertex
    pub fn with_weight(mut self, weight: f64) -> Self {
        self.weight = weight;
        self
    }
}

/// A T-face (quad) in the T-mesh
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TFace {
    /// Unique face ID
    pub id: u32,
    /// Control point indices (4 for quads)
    pub vertices: [u32; 4],
    /// Refinement level
    pub level: u32,
    /// Is this face refined (has children)?
    pub is_refined: bool,
}

impl TFace {
    /// Create a new T-face
    pub fn new(id: u32, v0: u32, v1: u32, v2: u32, v3: u32) -> Self {
        Self {
            id,
            vertices: [v0, v1, v2, v3],
            level: 0,
            is_refined: false,
        }
    }
}

/// T-junction edge (connects control points at different refinement levels)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TJunction {
    /// First vertex ID
    pub v0: u32,
    /// Second vertex ID
    pub v1: u32,
    /// Is this a T-junction (one vertex refined, other not)?
    pub is_tjunction: bool,
}

/// Complete T-mesh structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TMesh {
    /// Name
    pub name: String,
    /// T-vertices (control points)
    pub vertices: HashMap<u32, TVertex>,
    /// T-faces (quads)
    pub faces: HashMap<u32, TFace>,
    /// T-junctions (special edges)
    pub tjunctions: Vec<TJunction>,
    /// Maximum refinement level
    pub max_level: u32,
}

impl TMesh {
    /// Create a new T-mesh
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            vertices: HashMap::new(),
            faces: HashMap::new(),
            tjunctions: Vec::new(),
            max_level: 0,
        }
    }

    /// Add a vertex to the T-mesh
    pub fn add_vertex(&mut self, vertex: TVertex) {
        self.vertices.insert(vertex.id, vertex);
    }

    /// Add a face to the T-mesh
    pub fn add_face(&mut self, face: TFace) {
        if face.level > self.max_level {
            self.max_level = face.level;
        }
        self.faces.insert(face.id, face);
    }

    /// Get a vertex by ID
    pub fn vertex(&self, id: u32) -> Option<&TVertex> {
        self.vertices.get(&id)
    }

    /// Get a mutable vertex by ID
    pub fn vertex_mut(&mut self, id: u32) -> Option<&mut TVertex> {
        self.vertices.get_mut(&id)
    }

    /// Get a face by ID
    pub fn face(&self, id: u32) -> Option<&TFace> {
        self.faces.get(&id)
    }

    /// Number of vertices
    pub fn vertex_count(&self) -> usize {
        self.vertices.len()
    }

    /// Number of faces
    pub fn face_count(&self) -> usize {
        self.faces.len()
    }

    /// Check validity of T-mesh structure
    pub fn is_valid(&self) -> bool {
        // All face vertices must exist
        for face in self.faces.values() {
            for &v_id in &face.vertices {
                if !self.vertices.contains_key(&v_id) {
                    return false;
                }
            }
        }
        true
    }

    /// Get all faces at a specific refinement level
    pub fn faces_at_level(&self, level: u32) -> Vec<&TFace> {
        self.faces
            .values()
            .filter(|f| f.level == level)
            .collect()
    }

    /// Get all vertices at a specific refinement level
    pub fn vertices_at_level(&self, level: u32) -> Vec<&TVertex> {
        self.vertices
            .values()
            .filter(|v| v.level == level)
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_tmesh() {
        let tmesh = TMesh::new("test");
        assert_eq!(tmesh.vertex_count(), 0);
        assert_eq!(tmesh.face_count(), 0);
    }

    #[test]
    fn test_add_vertex() {
        let mut tmesh = TMesh::new("test");
        let v = TVertex::new(0, Vector3::zeros());
        tmesh.add_vertex(v);
        assert_eq!(tmesh.vertex_count(), 1);
    }

    #[test]
    fn test_add_face() {
        let mut tmesh = TMesh::new("test");
        for i in 0..4 {
            tmesh.add_vertex(TVertex::new(i, Vector3::zeros()));
        }

        let face = TFace::new(0, 0, 1, 2, 3);
        tmesh.add_face(face);
        assert_eq!(tmesh.face_count(), 1);
        assert!(tmesh.is_valid());
    }

    #[test]
    fn test_refinement_levels() {
        let mut tmesh = TMesh::new("test");

        // Add vertices at different levels
        for i in 0..4 {
            let mut v = TVertex::new(i, Vector3::zeros());
            v.level = 0;
            tmesh.add_vertex(v);
        }

        for i in 4..8 {
            let mut v = TVertex::new(i, Vector3::ones());
            v.level = 1;
            tmesh.add_vertex(v);
        }

        let level0 = tmesh.vertices_at_level(0);
        let level1 = tmesh.vertices_at_level(1);

        assert_eq!(level0.len(), 4);
        assert_eq!(level1.len(), 4);
    }
}
