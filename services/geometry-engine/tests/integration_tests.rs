//! Integration tests for geometry engine

use geometry_engine::*;
use nalgebra::Vector3;

#[test]
fn test_complete_mesh_workflow() {
    // Create a simple cube
    let mut mesh = MeshBuilder::new("test_cube")
        .vertex(Vector3::new(0.0, 0.0, 0.0))
        .vertex(Vector3::new(1.0, 0.0, 0.0))
        .vertex(Vector3::new(1.0, 1.0, 0.0))
        .vertex(Vector3::new(0.0, 1.0, 0.0))
        .vertex(Vector3::new(0.0, 0.0, 1.0))
        .vertex(Vector3::new(1.0, 0.0, 1.0))
        .vertex(Vector3::new(1.0, 1.0, 1.0))
        .vertex(Vector3::new(0.0, 1.0, 1.0))
        // Bottom face
        .triangle(0, 1, 2)
        .triangle(0, 2, 3)
        // Top face
        .triangle(4, 6, 5)
        .triangle(4, 7, 6)
        // Front face
        .triangle(0, 5, 1)
        .triangle(0, 4, 5)
        // Back face
        .triangle(2, 7, 3)
        .triangle(2, 6, 7)
        // Left face
        .triangle(0, 3, 7)
        .triangle(0, 7, 4)
        // Right face
        .triangle(1, 5, 6)
        .triangle(1, 6, 2)
        .build();

    // Test basic properties
    assert_eq!(mesh.vertex_count(), 8);
    assert_eq!(mesh.face_count(), 12);
    assert!(mesh.edge_count() > 0);

    // Test bounds
    let (min, max) = mesh.bounds().unwrap();
    assert_eq!(min, Vector3::new(0.0, 0.0, 0.0));
    assert_eq!(max, Vector3::new(1.0, 1.0, 1.0));

    // Test center
    let center = mesh.center().unwrap();
    assert!((center - Vector3::new(0.5, 0.5, 0.5)).norm() < 0.01);

    // Normalize mesh
    mesh.normalize();
    assert!(mesh.bounds().unwrap().0.norm() < 0.1);

    // Validate topology
    let validator = MeshValidator::new(1e-10);
    let report = validator.validate(&mesh);
    assert!(report.is_valid);

    // Test half-edge topology
    let topology = HalfEdgeTopology::from_mesh(&mesh).unwrap();
    assert!(topology.is_closed());
    assert_eq!(topology.non_manifold_edges(), 0);
}

#[test]
fn test_mesh_validation_detects_issues() {
    // Create degenerate mesh
    let mesh = MeshBuilder::new("degenerate")
        .vertex(Vector3::new(0.0, 0.0, 0.0))
        .vertex(Vector3::new(1.0, 0.0, 0.0))
        .vertex(Vector3::new(2.0, 0.0, 0.0))
        .triangle(0, 1, 2)
        .build();

    let validator = MeshValidator::new(1e-10);
    let report = validator.validate(&mesh);

    assert!(!report.is_valid);
    assert!(!report.issues.is_empty());
}

#[test]
fn test_topology_operations() {
    let mesh = MeshBuilder::new("tet")
        .vertex(Vector3::new(0.0, 0.0, 0.0))
        .vertex(Vector3::new(1.0, 0.0, 0.0))
        .vertex(Vector3::new(0.5, 1.0, 0.0))
        .vertex(Vector3::new(0.5, 0.5, 1.0))
        .triangle(0, 1, 2)
        .triangle(0, 1, 3)
        .triangle(1, 2, 3)
        .triangle(2, 0, 3)
        .build();

    let topo = HalfEdgeTopology::from_mesh(&mesh).unwrap();

    // Test vertex queries
    for v in 0..4 {
        let adjacent = topo.adjacent_vertices(v);
        assert!(!adjacent.is_empty());

        let faces = topo.vertex_faces(v);
        assert!(!faces.is_empty());
    }

    // Test boundary
    assert!(!topo.is_closed());
    assert!(!topo.boundary_edges().is_empty());
}

#[test]
fn test_geometry_utilities() {
    let p0 = Vector3::new(0.0, 0.0, 0.0);
    let p1 = Vector3::new(1.0, 0.0, 0.0);
    let p2 = Vector3::new(0.0, 1.0, 0.0);

    // Test area computation
    let area = crate::utils::triangle_area(p0, p1, p2);
    assert!((area - 0.5).abs() < 0.001);

    // Test angle computation
    let v1 = Vector3::new(1.0, 0.0, 0.0);
    let v2 = Vector3::new(0.0, 1.0, 0.0);
    let angle = crate::utils::angle_between(v1, v2);
    assert!((angle - std::f64::consts::PI / 2.0).abs() < 0.001);

    // Test projection
    let point = Vector3::new(0.5, 0.5, 1.0);
    let normal = Vector3::new(0.0, 0.0, 1.0);
    let plane_point = Vector3::new(0.0, 0.0, 0.0);
    let projected = crate::utils::project_to_plane(point, normal, plane_point);
    assert!((projected - Vector3::new(0.5, 0.5, 0.0)).norm() < 0.001);
}

#[test]
fn test_large_mesh_handling() {
    // Create a large mesh
    let mut builder = MeshBuilder::new("large");

    const GRID_SIZE: usize = 10;
    let vertices_count = GRID_SIZE * GRID_SIZE;

    // Add vertices in a grid
    for i in 0..GRID_SIZE {
        for j in 0..GRID_SIZE {
            let x = i as f64 / (GRID_SIZE - 1) as f64;
            let y = j as f64 / (GRID_SIZE - 1) as f64;
            builder = builder.vertex(Vector3::new(x, y, 0.0));
        }
    }

    // Add faces
    for i in 0..(GRID_SIZE - 1) {
        for j in 0..(GRID_SIZE - 1) {
            let v0 = (i * GRID_SIZE + j) as u32;
            let v1 = (i * GRID_SIZE + j + 1) as u32;
            let v2 = ((i + 1) * GRID_SIZE + j) as u32;
            let v3 = ((i + 1) * GRID_SIZE + j + 1) as u32;

            builder = builder.triangle(v0, v1, v2);
            builder = builder.triangle(v1, v3, v2);
        }
    }

    let mesh = builder.build();

    assert_eq!(mesh.vertex_count(), vertices_count);
    assert_eq!(mesh.face_count(), (GRID_SIZE - 1) * (GRID_SIZE - 1) * 2);

    // Validate large mesh
    let validator = MeshValidator::new(1e-10);
    let report = validator.validate(&mesh);
    assert!(report.is_valid);
}

#[test]
fn test_mesh_serialization() {
    use serde_json;

    let mesh = MeshBuilder::new("test")
        .vertex(Vector3::new(0.0, 0.0, 0.0))
        .vertex(Vector3::new(1.0, 0.0, 0.0))
        .vertex(Vector3::new(0.5, 1.0, 0.0))
        .triangle(0, 1, 2)
        .build();

    // Serialize
    let json = serde_json::to_string(&mesh).unwrap();

    // Deserialize
    let deserialized: Mesh = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.vertex_count(), mesh.vertex_count());
    assert_eq!(deserialized.face_count(), mesh.face_count());
}

#[test]
fn test_mesh_normalization() {
    let mut mesh = MeshBuilder::new("non-normalized")
        .vertex(Vector3::new(100.0, 200.0, 300.0))
        .vertex(Vector3::new(101.0, 200.0, 300.0))
        .vertex(Vector3::new(100.5, 201.0, 300.0))
        .triangle(0, 1, 2)
        .build();

    let (old_min, old_max) = mesh.bounds().unwrap();
    mesh.normalize();
    let (new_min, new_max) = mesh.bounds().unwrap();

    // After normalization, bounds should be roughly [-0.5, 0.5]
    assert!(new_max.norm() < 1.0);
    assert!(new_min.norm() < 1.0);
}
