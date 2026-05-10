//! gRPC server for T-Spline kernel

use std::net::SocketAddr;
use tspline_kernel::TMesh;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_target(false)
        .with_level(true)
        .init();

    let addr = "127.0.0.1:50053".parse::<SocketAddr>()?;
    info!("Starting T-Spline kernel server on {}", addr);

    let tmesh = TMesh::new("example");
    info!("T-Spline kernel ready: vertices={}, faces={}", tmesh.vertex_count(), tmesh.face_count());

    // TODO: Implement gRPC service
    // For now, just run until interrupted

    tokio::signal::ctrl_c().await?;
    info!("Shutting down");

    Ok(())
}
