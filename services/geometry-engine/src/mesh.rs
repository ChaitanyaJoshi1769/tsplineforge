//! Core mesh data structures and builders

use nalgebra::Vector3;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// A 3D point/vertex in the mesh
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Vertex {
    /// Unique vertex ID
    pub id: u32,
    /// 3D position
    pub position: Vector3<f64>,
    /// Vertex normal (computed)
    pub normal: Option<Vector3<f64>>,
    /// UV coordinate
    pub uv: Option<[f32; 2]>,
}

impl Vertex {
    /// Create a new vertex
    pub fn new(id: u32, position: Vector3<f64>) -> Self {
        Self {
            id,
            position,
            normal: None,
            uv: None,
        }
    }

    /// Set the vertex normal
    pub fn with_normal(mut self, normal: Vector3<f64>) -> Self {
        self.normal = Some(normal.normalize());
        self
    }

    /// Set UV coordinate
    pub fn with_uv(mut self, uv: [f32; 2]) -> Self {
        self.uv = Some(uv);
        self
    }
}

/// A mesh face (triangle or quad)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Face {
    /// Unique face ID
    pub id: u32,
    /// Vertex indices
    pub vertices: Vec<u32>,
    /// Face normal (computed)
    pub normal: Option<Vector3<f64>>,
}

impl Face {
    /// Create a triangular face
    pub fn triangle(id: u32, v0: u32, v1: u32, v2: u32) -> Self {
        Self {
            id,
            vertices: vec![v0, v1, v2],
            normal: None,
        }
    }

    /// Create a quad face
    pub fn quad(id: u32, v0: u32, v1: u32, v2: u32, v3: u32) -> Self {
        Self {
            id,
            vertices: vec![v0, v1, v2, v3],
            normal: None,
        }
    }

    /// Check if face is a triangle
    pub fn is_triangle(&self) -> bool {
        self.vertices.len() == 3
    }

    /// Check if face is a quad
    pub fn is_quad(&self) -> bool {
        self.vertices.len() == 4
    }

    /// Number of sides
    pub fn degree(&self) -> usize {
        self.vertices.len()
    }
}

/// Mesh edge
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Eq, PartialEq, Hash)]
pub struct Edge {
    /// First vertex index
    pub v0: u32,
    /// Second vertex index
    pub v1: u32,
}

impl Edge {
    /// Create a new edge (normalized so v0 <= v1)
    pub fn new(v0: u32, v1: u32) -> Self {
        if v0 <= v1 {
            Self { v0, v1 }
        } else {
            Self { v0: v1, v1: v0 }
        }
    }

    /// Reverse the edge direction
    pub fn reverse(&self) -> Self {
        Self {
            v0: self.v1,
            v1: self.v0,
        }
    }
}

/// A complete 3D triangle/quad mesh
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mesh {
    /// Unique mesh ID
    pub id: Uuid,
    /// Name
    pub name: String,
    /// Vertices
    pub vertices: Vec<Vertex>,
    /// Faces
    pub faces: Vec<Face>,
    /// Metadata
    pub metadata: HashMap<String, String>,
}

impl Mesh {
    /// Create an empty mesh
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: name.into(),
            vertices: Vec::new(),
            faces: Vec::new(),
            metadata: HashMap::new(),
        }
    }

    /// Number of vertices
    pub fn vertex_count(&self) -> usize {
        self.vertices.len()
    }

    /// Number of faces
    pub fn face_count(&self) -> usize {
        self.faces.len()
    }

    /// Number of unique edges
    pub fn edge_count(&self) -> usize {
        let mut edges = std::collections::HashSet::new();
        for face in &self.faces {
            let n = face.vertices.len();
            for i in 0..n {
                let v0 = face.vertices[i];
                let v1 = face.vertices[(i + 1) % n];
                edges.insert(Edge::new(v0, v1));
            }
        }
        edges.len()
    }

    /// Get a vertex by ID
    pub fn vertex(&self, id: u32) -> Option<&Vertex> {
        self.vertices.iter().find(|v| v.id == id)
    }

    /// Get a mutable vertex by ID
    pub fn vertex_mut(&mut self, id: u32) -> Option<&mut Vertex> {
        self.vertices.iter_mut().find(|v| v.id == id)
    }

    /// Compute vertex normals by averaging adjacent face normals
    pub fn compute_vertex_normals(&mut self) {
        let mut vertex_normals: HashMap<u32, Vector3<f64>> = HashMap::new();

        // Compute face normals and accumulate
        for face in &self.faces {
            if face.vertices.len() < 3 {
                continue;
            }

            let p0 = self.vertices[face.vertices[0] as usize].position;
            let p1 = self.vertices[face.vertices[1] as usize].position;
            let p2 = self.vertices[face.vertices[2] as usize].position;

            let n = (p1 - p0).cross(&(p2 - p0));
            if n.norm() > 1e-10 {
                let n_normalized = n.normalize();
                for &v_idx in &face.vertices {
                    *vertex_normals.entry(v_idx).or_insert_with(Vector3::zeros) += n_normalized;
                }
            }
        }

        // Normalize and assign
        for vertex in &mut self.vertices {
            if let Some(normal) = vertex_normals.get(&vertex.id) {
                vertex.normal = Some(normal.normalize());
            }
        }
    }

    /// Compute bounding box
    pub fn bounds(&self) -> Option<(Vector3<f64>, Vector3<f64>)> {
        if self.vertices.is_empty() {
            return None;
        }

        let mut min = self.vertices[0].position;
        let mut max = min;

        for vertex in &self.vertices {
            for i in 0..3 {
                if vertex.position[i] < min[i] {
                    min[i] = vertex.position[i];
                }
                if vertex.position[i] > max[i] {
                    max[i] = vertex.position[i];
                }
            }
        }

        Some((min, max))
    }

    /// Get mesh center
    pub fn center(&self) -> Option<Vector3<f64>> {
        if self.vertices.is_empty() {
            return None;
        }

        let sum = self.vertices.iter().map(|v| v.position).fold(
            Vector3::zeros(),
            |acc, pos| acc + pos,
        );

        Some(sum / self.vertices.len() as f64)
    }

    /// Normalize mesh to unit cube centered at origin
    pub fn normalize(&mut self) {
        let (min, max) = match self.bounds() {
            Some(b) => b,
            None => return,
        };

        let center = (min + max) / 2.0;
        let scale = (max - min).norm();

        if scale > 1e-10 {
            for vertex in &mut self.vertices {
                vertex.position = (vertex.position - center) / scale;
            }
        }
    }
}

/// Builder for constructing meshes programmatically
pub struct MeshBuilder {
    name: String,
    vertices: Vec<Vertex>,
    faces: Vec<Face>,
}

impl MeshBuilder {
    /// Create a new mesh builder
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            vertices: Vec::new(),
            faces: Vec::new(),
        }
    }

    /// Add a vertex
    pub fn vertex(mut self, position: Vector3<f64>) -> Self {
        let id = self.vertices.len() as u32;
        self.vertices.push(Vertex::new(id, position));
        self
    }

    /// Add multiple vertices
    pub fn vertices(mut self, positions: Vec<Vector3<f64>>) -> Self {
        for (i, pos) in positions.into_iter().enumerate() {
            self.vertices.push(Vertex::new(i as u32, pos));
        }
        self
    }

    /// Add a triangular face
    pub fn triangle(mut self, v0: u32, v1: u32, v2: u32) -> Self {
        let id = self.faces.len() as u32;
        self.faces.push(Face::triangle(id, v0, v1, v2));
        self
    }

    /// Add a quad face
    pub fn quad(mut self, v0: u32, v1: u32, v2: u32, v3: u32) -> Self {
        let id = self.faces.len() as u32;
        self.faces.push(Face::quad(id, v0, v1, v2, v3));
        self
    }

    /// Build the mesh
    pub fn build(self) -> Mesh {
        let mut mesh = Mesh {
            id: Uuid::new_v4(),
            name: self.name,
            vertices: self.vertices,
            faces: self.faces,
            metadata: HashMap::new(),
        };
        mesh.compute_vertex_normals();
        mesh
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_mesh() {
        let mesh = Mesh::new("test");
        assert_eq!(mesh.vertex_count(), 0);
        assert_eq!(mesh.face_count(), 0);
    }

    #[test]
    fn test_mesh_builder() {
        let mesh = MeshBuilder::new("cube")
            .vertex(Vector3::new(0.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 1.0, 0.0))
            .triangle(0, 1, 2)
            .build();

        assert_eq!(mesh.vertex_count(), 3);
        assert_eq!(mesh.face_count(), 1);
    }

    #[test]
    fn test_mesh_bounds() {
        let mesh = MeshBuilder::new("test")
            .vertex(Vector3::new(0.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 1.0, 1.0))
            .triangle(0, 1, 0)
            .build();

        let (min, max) = mesh.bounds().unwrap();
        assert_eq!(min, Vector3::new(0.0, 0.0, 0.0));
        assert_eq!(max, Vector3::new(1.0, 1.0, 1.0));
    }
}
