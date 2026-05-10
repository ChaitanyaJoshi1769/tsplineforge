//! gRPC server for geometry engine

use geometry_engine::{Config, Mesh, MeshBuilder, MeshValidator};
use nalgebra::Vector3;
use std::net::SocketAddr;
use tracing::{error, info};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_target(false)
        .with_level(true)
        .init();

    let addr = "127.0.0.1:50051".parse::<SocketAddr>()?;
    info!("Starting geometry engine server on {}", addr);

    // TODO: Implement gRPC service once tonic protobuf stubs are generated
    // For now, just demonstrate the geometry engine

    let config = Config::default();
    info!("Config: {:?}", config);

    // Example: Create a simple mesh
    let mesh = MeshBuilder::new("example")
        .vertex(Vector3::new(0.0, 0.0, 0.0))
        .vertex(Vector3::new(1.0, 0.0, 0.0))
        .vertex(Vector3::new(0.5, 1.0, 0.0))
        .vertex(Vector3::new(0.5, 0.5, 1.0))
        .triangle(0, 1, 2)
        .triangle(0, 1, 3)
        .triangle(1, 2, 3)
        .triangle(2, 0, 3)
        .build();

    info!("Created mesh: {} vertices, {} faces", mesh.vertex_count(), mesh.face_count());

    // Validate mesh
    let validator = MeshValidator::new(1e-10);
    let report = validator.validate(&mesh);
    info!("Validation: valid={}, severity={}, issues={}", report.is_valid, report.severity, report.issues.len());

    // Server would normally run indefinitely
    // For now, just demonstrate it works
    tokio::signal::ctrl_c().await?;
    info!("Shutting down");

    Ok(())
}
