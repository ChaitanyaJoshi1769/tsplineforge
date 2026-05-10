//! T-Spline surface evaluation

use nalgebra::Vector3;
use serde::{Deserialize, Serialize};

use crate::TMesh;

/// Point on T-Spline surface for evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationPoint {
    /// Parameter u coordinate [0,1]
    pub u: f64,
    /// Parameter v coordinate [0,1]
    pub v: f64,
    /// 3D position on surface
    pub position: Vector3<f64>,
    /// Surface normal
    pub normal: Option<Vector3<f64>>,
    /// Curvature information
    pub curvature: Option<[f64; 2]>,
}

impl EvaluationPoint {
    /// Create new evaluation point
    pub fn new(u: f64, v: f64, position: Vector3<f64>) -> Self {
        Self {
            u,
            v,
            position,
            normal: None,
            curvature: None,
        }
    }

    /// Add normal vector
    pub fn with_normal(mut self, normal: Vector3<f64>) -> Self {
        self.normal = Some(normal.normalize());
        self
    }
}

/// T-Spline surface evaluator
pub struct SurfaceEvaluator;

impl SurfaceEvaluator {
    /// Evaluate surface at parameter (u, v)
    pub fn evaluate(_tmesh: &TMesh, _u: f64, _v: f64) -> EvaluationPoint {
        // TODO: Implement T-Spline evaluation:
        // 1. Find containing patch at parameter (u, v)
        // 2. Compute non-uniform basis functions
        // 3. Evaluate with NURBS blending
        // 4. Apply weights for rational T-Splines

        EvaluationPoint::new(0.0, 0.0, Vector3::zeros())
    }

    /// Evaluate multiple points (grid)
    pub fn evaluate_grid(
        tmesh: &TMesh,
        u_samples: usize,
        v_samples: usize,
    ) -> Vec<Vec<EvaluationPoint>> {
        let mut grid = Vec::new();

        for i in 0..u_samples {
            let mut row = Vec::new();
            for j in 0..v_samples {
                let u = i as f64 / (u_samples - 1) as f64;
                let v = j as f64 / (v_samples - 1) as f64;
                row.push(Self::evaluate(tmesh, u, v));
            }
            grid.push(row);
        }

        grid
    }

    /// Compute surface normals using finite differences
    pub fn compute_normals(tmesh: &TMesh) -> Vec<Vector3<f64>> {
        let delta = 0.001;
        let mut normals = Vec::new();

        // For each face, compute normal at center
        for face in tmesh.faces.values() {
            let u = 0.5;
            let v = 0.5;

            let p = Self::evaluate(tmesh, u, v).position;
            let pu = Self::evaluate(tmesh, u + delta, v).position;
            let pv = Self::evaluate(tmesh, u, v + delta).position;

            let tangent_u = (pu - p) / delta;
            let tangent_v = (pv - p) / delta;
            let normal = tangent_u.cross(&tangent_v).normalize();

            normals.push(normal);
        }

        normals
    }
}
