#![forbid(unsafe_code)]
#![warn(missing_docs)]
//! T-Spline kernel for surface representation and refinement
//!
//! Provides hierarchical T-mesh structures, local refinement,
//! and surface evaluation for CAD applications.

pub mod tmesh;
pub mod refinement;
pub mod evaluation;
pub mod continuity;

pub use tmesh::{TMesh, TVertex, TFace};
pub use refinement::{LocalRefinement, RefinementLevel};
pub use evaluation::{SurfaceEvaluator, EvaluationPoint};
pub use continuity::{ContinuityConstraint, ContinuityEnforcer};

use serde::{Deserialize, Serialize};

/// Version information
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Result type for T-Spline operations
pub type Result<T> = std::result::Result<T, TSplineError>;

/// Errors in T-Spline operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TSplineError {
    /// Invalid T-mesh structure
    InvalidTMesh(String),
    /// Refinement failed
    RefinementFailed(String),
    /// Evaluation error
    EvaluationError(String),
    /// Continuity constraint violated
    ContinuityViolation(String),
}

impl std::fmt::Display for TSplineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidTMesh(msg) => write!(f, "Invalid T-mesh: {}", msg),
            Self::RefinementFailed(msg) => write!(f, "Refinement failed: {}", msg),
            Self::EvaluationError(msg) => write!(f, "Evaluation error: {}", msg),
            Self::ContinuityViolation(msg) => write!(f, "Continuity violation: {}", msg),
        }
    }
}

impl std::error::Error for TSplineError {}

/// T-Spline degree (default cubic)
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TSplineDegree {
    /// Linear
    Linear,
    /// Quadratic
    Quadratic,
    /// Cubic (standard)
    Cubic,
}

impl Default for TSplineDegree {
    fn default() -> Self {
        Self::Cubic
    }
}
