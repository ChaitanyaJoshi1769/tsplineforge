//! gRPC server for surface fitting

use surface_fitting::{SurfaceFitter, FittingConfig};
use std::net::SocketAddr;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_target(false)
        .with_level(true)
        .init();

    let addr = "127.0.0.1:50054".parse::<SocketAddr>()?;
    info!("Starting surface fitting server on {}", addr);

    let config = FittingConfig::default();
    let _fitter = SurfaceFitter::new(config);

    info!("Surface fitting server ready");

    // TODO: Implement gRPC service
    // For now, just run until interrupted

    tokio::signal::ctrl_c().await?;
    info!("Shutting down");

    Ok(())
}
