//! gRPC server for remesh engine

use remesh_engine::{Remesher, RemeshConfig};
use std::net::SocketAddr;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_target(false)
        .with_level(true)
        .init();

    let addr = "127.0.0.1:50052".parse::<SocketAddr>()?;
    info!("Starting remesh engine server on {}", addr);

    let config = RemeshConfig::default();
    let remesher = Remesher::new(config);
    info!("Remesher configured: target {} quads", config.target_quad_count);

    // TODO: Implement gRPC service
    // For now, just run until interrupted

    tokio::signal::ctrl_c().await?;
    info!("Shutting down");

    Ok(())
}
