//! T-Spline surface fitting algorithms

use geometry_engine::Mesh;
use tspline_kernel::TMesh;
use serde::{Deserialize, Serialize};

/// Surface fitting configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FittingConfig {
    /// Target fitting tolerance
    pub tolerance: f64,
    /// Maximum number of iterations
    pub max_iterations: u32,
    /// Fairness weight (0-1, default 0.1)
    pub fairness_weight: f64,
    /// Continuity level: C0, G1, or G2
    pub continuity: String,
    /// Use GPU acceleration
    pub use_gpu: bool,
}

impl Default for FittingConfig {
    fn default() -> Self {
        Self {
            tolerance: 1e-6,
            max_iterations: 100,
            fairness_weight: 0.1,
            continuity: "G1".to_string(),
            use_gpu: false,
        }
    }
}

/// Fitting result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FittingResult {
    /// Output T-Spline mesh
    pub tspline: Option<TMesh>,
    /// Final fitting error
    pub error: f64,
    /// Number of iterations performed
    pub iterations: u32,
    /// Convergence status
    pub converged: bool,
    /// Processing time (milliseconds)
    pub elapsed_ms: u128,
}

/// Surface fitter
pub struct SurfaceFitter {
    config: FittingConfig,
}

impl SurfaceFitter {
    /// Create fitter with configuration
    pub fn new(config: FittingConfig) -> Self {
        Self { config }
    }

    /// Fit T-Spline surface to mesh
    pub fn fit(&self, input_mesh: &Mesh, mut tspline: TMesh) -> crate::Result<FittingResult> {
        let start = std::time::Instant::now();

        // Validate inputs
        if input_mesh.vertex_count() < 3 {
            return Err(crate::FittingError::InsufficientData);
        }

        let control_point_count = tspline.vertex_count();
        if control_point_count == 0 {
            return Err(crate::FittingError::InsufficientData);
        }

        // Iterative refinement fitting
        let mut total_error = 0.0;
        let mut converged = false;
        let mut iteration = 0;

        for iter in 0..self.config.max_iterations {
            iteration = iter + 1;

            // Sample the input mesh surface
            let samples = Self::sample_mesh_surface(input_mesh, 100);

            // Evaluate current T-spline at sample points
            let current_values = Self::evaluate_tspline_at_samples(&tspline, &samples);

            // Compute fitting error
            let mut squared_error = 0.0;
            for (sample, current_val) in samples.iter().zip(current_values.iter()) {
                let diff = (sample - current_val).norm();
                squared_error += diff * diff;
            }

            total_error = (squared_error / samples.len() as f64).sqrt();

            // Check convergence
            if total_error < self.config.tolerance {
                converged = true;
                break;
            }

            // Step: Move control points toward sample cloud
            for cp_id in 0..control_point_count {
                let mut displacement = nalgebra::Vector3::zeros();
                let mut weight_sum = 0.0;

                // For each sample, accumulate weighted displacement
                for (sample, _) in samples.iter().enumerate() {
                    // Compute basis function influence at sample
                    let influence = Self::basis_function_influence(&tspline, cp_id as u32, sample as u32);

                    if influence > 1e-6 {
                        let sample_pos = &samples[sample];
                        displacement += influence * sample_pos;
                        weight_sum += influence;
                    }
                }

                if weight_sum > 1e-6 {
                    if let Some(cp) = tspline.vertex_mut(cp_id as u32) {
                        // Update position with damped step
                        let step = 0.1; // Step size for stability
                        cp.position = cp.position * (1.0 - step) + (displacement / weight_sum) * step;
                    }
                }
            }
        }

        let elapsed = start.elapsed();

        Ok(FittingResult {
            tspline: Some(tspline),
            error: total_error,
            iterations: iteration,
            converged,
            elapsed_ms: elapsed.as_millis(),
        })
    }

    /// Fit with automatic refinement
    pub fn fit_with_refinement(
        &self,
        input_mesh: &Mesh,
        mut tspline: TMesh,
    ) -> crate::Result<FittingResult> {
        let mut current_error = f64::INFINITY;
        let mut iteration = 0;

        // TODO: Implement adaptive refinement:
        // 1. Fit current T-mesh
        // 2. Analyze fitting error per patch
        // 3. Refine patches with high error
        // 4. Repeat until target tolerance achieved

        loop {
            // Fit current T-mesh
            let result = self.fit(input_mesh, &tspline)?;

            if let Some(fitted) = result.tspline {
                tspline = fitted;
            }

            current_error = result.error;
            iteration += 1;

            // Check convergence
            if current_error < self.config.tolerance || iteration >= self.config.max_iterations {
                return Ok(FittingResult {
                    tspline: Some(tspline),
                    error: current_error,
                    iterations: iteration,
                    converged: current_error < self.config.tolerance,
                    elapsed_ms: 0,
                });
            }

            // Refine mesh
            // tspline = self.refine_high_error_regions(&tspline, &error_map)?;
        }
    }

    /// Sample points on mesh surface for fitting
    fn sample_mesh_surface(mesh: &Mesh, samples_per_face: usize) -> Vec<nalgebra::Vector3<f64>> {
        let mut samples = Vec::new();

        for face in &mesh.faces {
            if face.vertices.len() < 3 {
                continue;
            }

            // Sample triangle/quad face with barycentric coordinates
            let v0 = mesh.vertices[face.vertices[0] as usize].position;
            let v1 = mesh.vertices[face.vertices[1] as usize].position;
            let v2 = mesh.vertices[face.vertices[2] as usize].position;

            for i in 0..samples_per_face {
                let u = (i as f64) / (samples_per_face as f64);
                let v = ((i * 7) as f64 % (samples_per_face as f64)) / (samples_per_face as f64);

                if u + v <= 1.0 {
                    let sample = (1.0 - u - v) * v0 + u * v1 + v * v2;
                    samples.push(sample);
                }
            }
        }

        samples
    }

    /// Evaluate T-spline at sample points
    fn evaluate_tspline_at_samples(
        tspline: &TMesh,
        samples: &[nalgebra::Vector3<f64>],
    ) -> Vec<nalgebra::Vector3<f64>> {
        samples
            .iter()
            .map(|_sample| {
                // For now, return average of control points
                // In full implementation, would evaluate basis functions
                let mut sum = nalgebra::Vector3::zeros();
                for cp_id in 0..tspline.vertex_count() {
                    if let Some(cp) = tspline.vertex(cp_id as u32) {
                        sum += cp.position;
                    }
                }
                sum / tspline.vertex_count() as f64
            })
            .collect()
    }

    /// Compute basis function influence at a point
    fn basis_function_influence(_tspline: &TMesh, _cp_id: u32, _sample_id: u32) -> f64 {
        // Simplified: uniform influence
        // Full implementation would use NURBS basis functions
        0.1
    }

    fn _build_basis_matrix(&self, _mesh: &Mesh) -> ndarray::Array2<f64> {
        // Compute basis function values at mesh surface points
        ndarray::Array2::zeros((0, 0))
    }

    fn _add_fairness_constraints(
        &self,
        _matrix: &mut ndarray::Array2<f64>,
        _weight: f64,
    ) {
        // Add Laplacian smoothing constraints
        // Penalizes surface curvature: weight * sum(||Lap(P_i)||^2)
    }

    fn _add_continuity_constraints(
        &self,
        _matrix: &mut ndarray::Array2<f64>,
    ) {
        // Add continuity constraints based on config
        // C0: Positional continuity at patch boundaries
        // G1: Tangent continuity (normal alignment)
        // G2: Curvature continuity (second derivative matching)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use nalgebra::Vector3;

    #[test]
    fn test_fitting_config_default() {
        let config = FittingConfig::default();
        assert_eq!(config.tolerance, 1e-6);
        assert_eq!(config.max_iterations, 100);
        assert_eq!(config.fairness_weight, 0.1);
        assert_eq!(config.continuity, "G1");
        assert!(!config.use_gpu);
    }

    #[test]
    fn test_surface_fitter_creation() {
        let config = FittingConfig::default();
        let _fitter = SurfaceFitter::new(config);
    }

    #[test]
    fn test_sample_mesh_surface() {
        // Create a simple test mesh (using geometry_engine)
        let samples = SurfaceFitter::sample_mesh_surface(
            &geometry_engine::MeshBuilder::new("test")
                .vertex(Vector3::new(0.0, 0.0, 0.0))
                .vertex(Vector3::new(1.0, 0.0, 0.0))
                .vertex(Vector3::new(0.5, 1.0, 0.0))
                .triangle(0, 1, 2)
                .build(),
            10,
        );

        assert!(samples.len() > 0);
        for sample in samples {
            assert!(sample.norm() <= 2.0); // Samples should be within reasonable bounds
        }
    }

    #[test]
    fn test_fitting_result_convergence() {
        let result = FittingResult {
            tspline: None,
            error: 0.0001,
            iterations: 5,
            converged: true,
            elapsed_ms: 100,
        };

        assert!(result.converged);
        assert!(result.error < 0.001);
    }
}
