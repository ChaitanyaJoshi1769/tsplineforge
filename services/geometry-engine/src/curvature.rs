//! Curvature computation for meshes using discrete differential geometry

use crate::mesh::Mesh;
use crate::topology::HalfEdgeTopology;
use nalgebra::{Matrix3, Vector3, SVD};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Principal curvatures at a point
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PrincipalCurvatures {
    /// Maximum principal curvature
    pub kmax: f64,
    /// Minimum principal curvature
    pub kmin: f64,
    /// Mean curvature
    pub kmean: f64,
    /// Gaussian curvature
    pub kgaussian: f64,
}

impl PrincipalCurvatures {
    /// Compute from principal values
    pub fn from_principals(kmax: f64, kmin: f64) -> Self {
        Self {
            kmax,
            kmin,
            kmean: (kmax + kmin) / 2.0,
            kgaussian: kmax * kmin,
        }
    }
}

/// Curvature computation engine
pub struct CurvatureCompute;

impl CurvatureCompute {
    /// Compute curvatures for all vertices using quadric fitting
    pub fn compute(mesh: &Mesh, _neighborhood_size: usize) -> Result<Vec<PrincipalCurvatures>, String> {
        let mut curvatures = Vec::with_capacity(mesh.vertex_count());
        let topology = HalfEdgeTopology::from_mesh(mesh);

        for vertex_id in 0..mesh.vertex_count() as u32 {
            let curv = Self::compute_vertex_curvature(mesh, &topology, vertex_id)?;
            curvatures.push(curv);
        }

        Ok(curvatures)
    }

    /// Compute curvature at a single vertex using quadric surface fitting
    fn compute_vertex_curvature(
        mesh: &Mesh,
        topology: &HalfEdgeTopology,
        vertex_id: u32,
    ) -> Result<PrincipalCurvatures, String> {
        let vertex = &mesh.vertices[vertex_id as usize];
        let vertex_pos = vertex.position;

        // Get one-ring neighborhood
        let neighbors = topology.adjacent_vertices(vertex_id);
        if neighbors.len() < 3 {
            return Ok(PrincipalCurvatures::from_principals(0.0, 0.0));
        }

        // Build local coordinate frame
        let vertex_normal = mesh.vertices[vertex_id as usize]
            .normal
            .unwrap_or_else(|| Vector3::new(0.0, 0.0, 1.0));

        let u_axis = if vertex_normal.dot(&Vector3::new(1.0, 0.0, 0.0)).abs() < 0.9 {
            vertex_normal.cross(&Vector3::new(1.0, 0.0, 0.0)).normalize()
        } else {
            vertex_normal.cross(&Vector3::new(0.0, 1.0, 0.0)).normalize()
        };
        let v_axis = vertex_normal.cross(&u_axis).normalize();

        // Build quadric matrix for least-squares fitting
        let mut A = nalgebra::Matrix::<f64, nalgebra::Dynamic, nalgebra::U5, nalgebra::VecStorage<f64, nalgebra::Dynamic, nalgebra::U5>>::zeros(neighbors.len());
        let mut b = nalgebra::DVector::zeros(neighbors.len());

        for (idx, &neighbor_id) in neighbors.iter().enumerate() {
            let neighbor_pos = mesh.vertices[neighbor_id as usize].position;
            let diff = neighbor_pos - vertex_pos;

            // Project to local 2D coordinates
            let u = diff.dot(&u_axis);
            let v = diff.dot(&v_axis);

            // Heights relative to vertex (z in local frame)
            let z = diff.dot(&vertex_normal);

            // Quadric equation: z = a*u^2 + b*v^2 + c*u*v + d*u + e*v
            // For curvature, we fit z ≈ (k1*u^2 + k2*v^2) / 2
            A[(idx, 0)] = u * u;
            A[(idx, 1)] = v * v;
            A[(idx, 2)] = u * v;
            A[(idx, 3)] = u;
            A[(idx, 4)] = v;
            b[idx] = z;
        }

        // Solve least-squares: min ||A*x - b||^2
        let qr = A.qr();
        let coeffs = qr.solve(&b).unwrap_or_else(|_| nalgebra::Vector5::zeros());

        // Extract curvatures from quadric coefficients
        // For z = a*u^2 + b*v^2 + c*u*v, the curvatures relate to a and b
        let k1 = 2.0 * coeffs[0];
        let k2 = 2.0 * coeffs[1];

        // Clamp to reasonable range and sort
        let k1 = k1.max(-100.0).min(100.0);
        let k2 = k2.max(-100.0).min(100.0);

        let kmax = k1.max(k2);
        let kmin = k1.min(k2);

        Ok(PrincipalCurvatures::from_principals(kmax, kmin))
    }

    /// Compute discrete Gaussian curvature using angle deficit
    pub fn gaussian_curvature(mesh: &Mesh, vertex_id: u32) -> Result<f64, String> {
        let topology = HalfEdgeTopology::from_mesh(mesh);

        // Angle deficit method: K = (2π - sum_angles) / area
        let vertex_faces = topology.vertex_faces(vertex_id);
        let mut angle_sum = 0.0;
        let mut area_sum = 0.0;

        for &face_id in &vertex_faces {
            let face = &mesh.faces[face_id as usize];
            let vertex_idx = face
                .vertices
                .iter()
                .position(|&v| v == vertex_id)
                .ok_or("Vertex not in face")?;

            let v0 = mesh.vertices[face.vertices[vertex_idx] as usize].position;
            let v1 = mesh.vertices[face.vertices[(vertex_idx + 1) % face.vertices.len()] as usize].position;
            let v2 = mesh.vertices[face.vertices[(vertex_idx + face.vertices.len() - 1) % face.vertices.len()] as usize].position;

            let e1 = (v1 - v0).normalize();
            let e2 = (v2 - v0).normalize();
            let angle = (e1.dot(&e2)).acos();

            angle_sum += angle;
            area_sum += Self::triangle_area(v0, v1, v2);
        }

        if area_sum < 1e-10 {
            return Ok(0.0);
        }

        let angle_deficit = 2.0 * std::f64::consts::PI - angle_sum;
        Ok(angle_deficit / area_sum)
    }

    /// Compute mean curvature
    pub fn mean_curvature(mesh: &Mesh, vertex_id: u32) -> Result<f64, String> {
        let topology = HalfEdgeTopology::from_mesh(mesh);
        let vertex = &mesh.vertices[vertex_id as usize];
        let vertex_pos = vertex.position;
        let vertex_normal = vertex.normal.unwrap_or_else(|| Vector3::new(0.0, 0.0, 1.0));

        let edges = topology.vertex_edges(vertex_id);
        let mut mean_curvature = 0.0;
        let mut total_area = 0.0;

        for &edge_id in &edges {
            if let Some(opposite_vertex_id) = Self::get_opposite_vertex(&topology, vertex_id, edge_id) {
                let opposite_pos = mesh.vertices[opposite_vertex_id as usize].position;
                let edge_vec = opposite_pos - vertex_pos;
                let edge_len = edge_vec.norm();

                if edge_len > 1e-10 {
                    let edge_dir = edge_vec / edge_len;
                    let angle = vertex_normal.dot(&edge_dir).acos();

                    // Mean curvature relates to edge angle and length
                    mean_curvature += angle / edge_len;
                    total_area += edge_len;
                }
            }
        }

        if total_area < 1e-10 {
            return Ok(0.0);
        }

        Ok(mean_curvature / total_area)
    }

    /// Compute principal directions from local geometry
    pub fn principal_directions(
        mesh: &Mesh,
        vertex_id: u32,
    ) -> Result<(Vector3<f64>, Vector3<f64>), String> {
        let topology = HalfEdgeTopology::from_mesh(mesh);
        let vertex = &mesh.vertices[vertex_id as usize];
        let vertex_pos = vertex.position;
        let vertex_normal = vertex
            .normal
            .unwrap_or_else(|| Vector3::new(0.0, 0.0, 1.0))
            .normalize();

        // Compute shape operator (Weingarten map) using one-ring vertices
        let neighbors = topology.adjacent_vertices(vertex_id);
        if neighbors.len() < 3 {
            // Arbitrary orthonormal basis
            let u = if vertex_normal.dot(&Vector3::new(1.0, 0.0, 0.0)).abs() < 0.9 {
                vertex_normal.cross(&Vector3::new(1.0, 0.0, 0.0)).normalize()
            } else {
                vertex_normal.cross(&Vector3::new(0.0, 1.0, 0.0)).normalize()
            };
            let v = vertex_normal.cross(&u).normalize();
            return Ok((u, v));
        }

        // Build shape operator matrix
        let mut S = Matrix3::zeros();

        for &neighbor_id in &neighbors {
            let neighbor_pos = mesh.vertices[neighbor_id as usize].position;
            let neighbor_normal = mesh.vertices[neighbor_id as usize]
                .normal
                .unwrap_or_else(|| Vector3::new(0.0, 0.0, 1.0))
                .normalize();

            let edge = (neighbor_pos - vertex_pos).normalize();
            let dn = neighbor_normal - vertex_normal;

            // Shape operator S = -dn / edge_length (simplified)
            let outer = edge * dn.transpose();
            S += outer;
        }

        S /= neighbors.len() as f64;

        // SVD to extract principal directions
        let svd = SVD::new(S, true, true);
        let u_mat = svd.u.unwrap();

        Ok((u_mat.column(0).into(), u_mat.column(1).into()))
    }

    /// Helper: get opposite vertex across an edge
    fn get_opposite_vertex(
        topology: &HalfEdgeTopology,
        vertex_id: u32,
        edge_id: usize,
    ) -> Option<u32> {
        topology.vertex_edges(vertex_id).iter().find_map(|&e| {
            if e == edge_id {
                Some(vertex_id)
            } else {
                None
            }
        });
        None
    }

    /// Helper: compute triangle area
    fn triangle_area(v0: Vector3<f64>, v1: Vector3<f64>, v2: Vector3<f64>) -> f64 {
        let e1 = v1 - v0;
        let e2 = v2 - v0;
        e1.cross(&e2).norm() / 2.0
    }
}
