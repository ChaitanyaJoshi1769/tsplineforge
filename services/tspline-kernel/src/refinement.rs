//! Local refinement operations on T-meshes

use crate::{Result, TSplineError, TMesh, TVertex, TFace};
use nalgebra::Vector3;

/// Refinement level descriptor
#[derive(Debug, Clone, Copy)]
pub struct RefinementLevel {
    /// Level number
    pub level: u32,
    /// Number of faces at this level
    pub face_count: usize,
    /// Number of vertices at this level
    pub vertex_count: usize,
}

/// Local refinement manager
pub struct LocalRefinement;

impl LocalRefinement {
    /// Refine a single face
    pub fn refine_face(tmesh: &mut TMesh, face_id: u32) -> Result<()> {
        let face = tmesh
            .face(face_id)
            .ok_or_else(|| TSplineError::RefinementFailed("Face not found".to_string()))?
            .clone();

        if face.is_refined {
            return Err(TSplineError::RefinementFailed(
                "Face already refined".to_string(),
            ));
        }

        // Step 1: Get parent face vertices and compute new control points
        let parent_vertices: Vec<_> = face
            .vertices
            .iter()
            .filter_map(|&vid| tmesh.vertex(vid).cloned())
            .collect();

        if parent_vertices.len() != 4 {
            return Err(TSplineError::RefinementFailed(
                "Invalid face vertex count".to_string(),
            ));
        }

        // Step 2: Create 4 child faces by 1-to-4 subdivision
        let new_level = face.level + 1;
        let next_id_offset = (tmesh.vertex_count() + tmesh.face_count() + 1) as u32;

        // Corner and edge midpoints (simplified)
        let corners = &parent_vertices;
        let edge_mids = [
            Self::midpoint(&corners[0].position, &corners[1].position),
            Self::midpoint(&corners[1].position, &corners[2].position),
            Self::midpoint(&corners[2].position, &corners[3].position),
            Self::midpoint(&corners[3].position, &corners[0].position),
        ];
        let center = Self::center(&parent_vertices);

        // Add new vertices
        let mut new_vertices = Vec::new();
        for i in 0..4 {
            let mid = TVertex::new(next_id_offset + i as u32, edge_mids[i]);
            new_vertices.push(mid);
            tmesh.add_vertex(new_vertices.last().unwrap().clone());
        }

        let center_v = TVertex::new(next_id_offset + 4, center);
        tmesh.add_vertex(center_v.clone());

        // Create 4 child faces
        let child_faces = [
            TFace::new(
                face_id + next_id_offset,
                corners[0].id,
                new_vertices[0].id,
                center_v.id,
                new_vertices[3].id,
            ),
            TFace::new(
                face_id + next_id_offset + 1,
                new_vertices[0].id,
                corners[1].id,
                new_vertices[1].id,
                center_v.id,
            ),
            TFace::new(
                face_id + next_id_offset + 2,
                center_v.id,
                new_vertices[1].id,
                corners[2].id,
                new_vertices[2].id,
            ),
            TFace::new(
                face_id + next_id_offset + 3,
                new_vertices[3].id,
                center_v.id,
                new_vertices[2].id,
                corners[3].id,
            ),
        ];

        for mut child in child_faces {
            child.level = new_level;
            tmesh.add_face(child);
        }

        Ok(())
    }

    /// Get refinement levels information
    pub fn get_levels(tmesh: &TMesh) -> Vec<RefinementLevel> {
        let mut levels = Vec::new();

        for level in 0..=tmesh.max_level {
            let face_count = tmesh.faces_at_level(level).len();
            let vertex_count = tmesh.vertices_at_level(level).len();

            levels.push(RefinementLevel {
                level,
                face_count,
                vertex_count,
            });
        }

        levels
    }

    /// Refine entire mesh uniformly
    pub fn refine_uniform(tmesh: &mut TMesh) -> Result<()> {
        let face_ids: Vec<_> = tmesh
            .faces
            .values()
            .filter(|f| !f.is_refined && f.level == tmesh.max_level)
            .map(|f| f.id)
            .collect();

        for face_id in face_ids {
            Self::refine_face(tmesh, face_id)?;
        }

        Ok(())
    }

    fn midpoint(p0: &Vector3<f64>, p1: &Vector3<f64>) -> Vector3<f64> {
        (p0 + p1) / 2.0
    }

    fn center(vertices: &[TVertex]) -> Vector3<f64> {
        let sum: Vector3<f64> = vertices
            .iter()
            .map(|v| v.position)
            .fold(Vector3::zeros(), |a, b| a + b);
        sum / vertices.len() as f64
    }
}
