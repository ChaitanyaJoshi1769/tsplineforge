#![forbid(unsafe_code)]
#![warn(missing_docs)]
//! TSplineForge Geometry Engine
//!
//! Core mesh representation, validation, and manipulation library.
//! Provides half-edge topology, spatial queries, and format support.

pub mod mesh;
pub mod topology;
pub mod validation;
pub mod spatial;
pub mod io;
pub mod utils;
pub mod curvature;

pub use mesh::{Mesh, MeshBuilder, Face, Vertex, Edge};
pub use topology::HalfEdgeTopology;
pub use validation::{MeshValidator, ValidationReport};
pub use spatial::{BVH, SpatialHash};
pub use curvature::{CurvatureCompute, PrincipalCurvatures};

/// Version information
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Geometry engine configuration
#[derive(Debug, Clone)]
pub struct Config {
    /// Enable parallel processing
    pub parallel: bool,
    /// Number of threads
    pub num_threads: Option<usize>,
    /// Epsilon for floating point comparisons
    pub epsilon: f64,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            parallel: true,
            num_threads: None,
            epsilon: 1e-10,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert!(!VERSION.is_empty());
    }
}
