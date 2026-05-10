#![forbid(unsafe_code)]
#![warn(missing_docs)]
//! Quad-dominant remeshing engine with AI assistance
//!
//! Implements curvature-aware, field-aligned quad mesh generation.

pub mod field;
pub mod remesher;
pub mod optimizer;
pub mod singularity;

pub use remesher::{Remesher, RemeshConfig};
pub use field::{DirectionField, EdgeFlowField};
pub use singularity::{Singularity, SingularityDetector};

/// Version information
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Result type for remeshing operations
pub type Result<T> = std::result::Result<T, RemeshError>;

/// Errors that can occur during remeshing
#[derive(Debug, Clone)]
pub enum RemeshError {
    /// Input mesh is invalid
    InvalidMesh(String),
    /// Algorithm failed to converge
    ConvergenceFailed,
    /// Invalid parameter
    InvalidParameter(String),
    /// Insufficient memory
    OutOfMemory,
}

impl std::fmt::Display for RemeshError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidMesh(msg) => write!(f, "Invalid mesh: {}", msg),
            Self::ConvergenceFailed => write!(f, "Algorithm failed to converge"),
            Self::InvalidParameter(msg) => write!(f, "Invalid parameter: {}", msg),
            Self::OutOfMemory => write!(f, "Out of memory"),
        }
    }
}

impl std::error::Error for RemeshError {}
