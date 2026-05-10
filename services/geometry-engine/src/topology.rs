//! Half-edge topology data structure for manifold mesh operations

use crate::mesh::{Edge, Mesh};
use std::collections::HashMap;

/// Half-edge element
#[derive(Debug, Clone, Copy)]
pub struct HalfEdge {
    /// Target vertex
    pub target: u32,
    /// Opposite half-edge
    pub opposite: Option<u32>,
    /// Next half-edge in face
    pub next: u32,
    /// Previous half-edge in face
    pub prev: u32,
    /// Source face
    pub face: u32,
}

/// Half-edge mesh topology for 2-manifold operations
pub struct HalfEdgeTopology {
    /// All half-edges (indexed)
    pub half_edges: Vec<HalfEdge>,
    /// Map from (source, target) to half-edge index
    pub edge_map: HashMap<(u32, u32), u32>,
    /// First outgoing half-edge for each vertex
    pub vertex_outgoing: HashMap<u32, u32>,
    /// Number of vertices
    pub num_vertices: u32,
    /// Number of faces
    pub num_faces: u32,
}

impl HalfEdgeTopology {
    /// Build half-edge topology from a mesh
    pub fn from_mesh(mesh: &Mesh) -> Result<Self, String> {
        let mut topology = HalfEdgeTopology {
            half_edges: Vec::new(),
            edge_map: HashMap::new(),
            vertex_outgoing: HashMap::new(),
            num_vertices: mesh.vertex_count() as u32,
            num_faces: mesh.face_count() as u32,
        };

        // Create half-edges for each face
        let mut face_half_edges: Vec<Vec<u32>> = vec![vec![]; mesh.face_count()];

        for (face_idx, face) in mesh.faces.iter().enumerate() {
            let n = face.vertices.len();

            for i in 0..n {
                let source = face.vertices[i];
                let target = face.vertices[(i + 1) % n];

                let he_idx = topology.half_edges.len() as u32;
                let next_idx = (topology.half_edges.len() + 1) as u32;

                let half_edge = HalfEdge {
                    target,
                    opposite: None,
                    next: if i + 1 < n { next_idx } else { he_idx - (n as u32 - 1) },
                    prev: if i > 0 { he_idx - 1 } else { he_idx + (n as u32 - 1) },
                    face: face_idx as u32,
                };

                topology.half_edges.push(half_edge);
                face_half_edges[face_idx].push(he_idx);
                topology.edge_map.insert((source, target), he_idx);

                if !topology.vertex_outgoing.contains_key(&source) {
                    topology.vertex_outgoing.insert(source, he_idx);
                }
            }
        }

        // Link opposite half-edges
        for ((source, target), &he_idx) in &topology.edge_map {
            if let Some(&opposite_idx) = topology.edge_map.get(&(*target, *source)) {
                topology.half_edges[*he_idx as usize].opposite = Some(opposite_idx);
                topology.half_edges[opposite_idx as usize].opposite = Some(*he_idx);
            }
        }

        Ok(topology)
    }

    /// Get all half-edges outgoing from a vertex
    pub fn vertex_edges(&self, vertex: u32) -> Vec<u32> {
        let mut edges = Vec::new();

        if let Some(&mut start_he) = self.vertex_outgoing.get(&vertex) {
            let mut current = start_he;
            loop {
                edges.push(current);

                let he = self.half_edges[current as usize];
                if let Some(opposite) = he.opposite {
                    current = self.half_edges[opposite as usize].next;
                } else {
                    break;
                }

                if current == start_he {
                    break;
                }
            }
        }

        edges
    }

    /// Get all adjacent vertices to a vertex
    pub fn adjacent_vertices(&self, vertex: u32) -> Vec<u32> {
        self.vertex_edges(vertex)
            .iter()
            .map(|&he_idx| self.half_edges[he_idx as usize].target)
            .collect()
    }

    /// Get all faces adjacent to a vertex
    pub fn vertex_faces(&self, vertex: u32) -> Vec<u32> {
        self.vertex_edges(vertex)
            .iter()
            .map(|&he_idx| self.half_edges[he_idx as usize].face)
            .collect()
    }

    /// Check if edge is on boundary (non-manifold or open)
    pub fn is_boundary_edge(&self, edge: Edge) -> bool {
        self.edge_map.get(&(edge.v0, edge.v1)).map_or(true, |&he_idx| {
            self.half_edges[he_idx as usize].opposite.is_none()
        })
    }

    /// Get all boundary edges
    pub fn boundary_edges(&self) -> Vec<Edge> {
        let mut boundary = Vec::new();

        for (edge, _) in &self.edge_map {
            if self.is_boundary_edge(Edge::new(edge.0, edge.1)) {
                boundary.push(Edge::new(edge.0, edge.1));
            }
        }

        boundary
    }

    /// Check if mesh is closed (no boundary)
    pub fn is_closed(&self) -> bool {
        self.boundary_edges().is_empty()
    }

    /// Count non-manifold edges
    pub fn non_manifold_edges(&self) -> usize {
        let mut edge_count: HashMap<Edge, usize> = HashMap::new();

        for (source, target) in self.edge_map.keys() {
            let edge = Edge::new(*source, *target);
            *edge_count.entry(edge).or_insert(0) += 1;
        }

        edge_count.values().filter(|&&count| count > 2).count()
    }

    /// Check if vertex is manifold (edges form continuous loop)
    pub fn is_vertex_manifold(&self, vertex: u32) -> bool {
        self.vertex_edges(vertex).len() == self.adjacent_vertices(vertex).len()
    }

    /// Get all non-manifold vertices
    pub fn non_manifold_vertices(&self) -> Vec<u32> {
        let mut non_manifold = Vec::new();

        for v in 0..self.num_vertices {
            if !self.is_vertex_manifold(v) {
                non_manifold.push(v);
            }
        }

        non_manifold
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mesh::MeshBuilder;
    use nalgebra::Vector3;

    #[test]
    fn test_half_edge_topology() {
        let mesh = MeshBuilder::new("triangle")
            .vertex(Vector3::new(0.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 0.0, 0.0))
            .vertex(Vector3::new(0.0, 1.0, 0.0))
            .triangle(0, 1, 2)
            .build();

        let topo = HalfEdgeTopology::from_mesh(&mesh).unwrap();
        assert_eq!(topo.num_vertices, 3);
        assert_eq!(topo.num_faces, 1);
    }

    #[test]
    fn test_adjacent_vertices() {
        let mesh = MeshBuilder::new("quad")
            .vertex(Vector3::new(0.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 0.0, 0.0))
            .vertex(Vector3::new(1.0, 1.0, 0.0))
            .vertex(Vector3::new(0.0, 1.0, 0.0))
            .quad(0, 1, 2, 3)
            .build();

        let topo = HalfEdgeTopology::from_mesh(&mesh).unwrap();
        let adjacent = topo.adjacent_vertices(0);
        assert_eq!(adjacent.len(), 2);
    }
}
