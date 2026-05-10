#![forbid(unsafe_code)]
#![warn(missing_docs)]
//! T-Spline surface fitting engine
//!
//! Least-squares fitting of T-Spline surfaces to mesh geometry
//! with fairness optimization and continuity constraints.

pub mod solver;
pub mod fitting;
pub mod diagnostics;

pub use fitting::{SurfaceFitter, FittingConfig, FittingResult};
pub use solver::{LinearSolver, SparseMatrix};
pub use diagnostics::{AccuracyDiagnostics, CurvatureDiagnostics};

use serde::{Deserialize, Serialize};

/// Version information
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Result type for fitting operations
pub type Result<T> = std::result::Result<T, FittingError>;

/// Errors in surface fitting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FittingError {
    /// Matrix is singular or ill-conditioned
    SingularMatrix,
    /// Solver failed to converge
    ConvergenceFailed(String),
    /// Invalid parameter
    InvalidParameter(String),
    /// Insufficient data points
    InsufficientData,
}

impl std::fmt::Display for FittingError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::SingularMatrix => write!(f, "Matrix is singular or ill-conditioned"),
            Self::ConvergenceFailed(msg) => write!(f, "Solver failed to converge: {}", msg),
            Self::InvalidParameter(msg) => write!(f, "Invalid parameter: {}", msg),
            Self::InsufficientData => write!(f, "Insufficient data points"),
        }
    }
}

impl std::error::Error for FittingError {}
