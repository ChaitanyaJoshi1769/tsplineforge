//! Utility functions for geometry operations

use nalgebra::Vector3;

/// Project point onto plane
pub fn project_to_plane(point: Vector3<f64>, plane_normal: Vector3<f64>, plane_point: Vector3<f64>) -> Vector3<f64> {
    let normal = plane_normal.normalize();
    let to_point = point - plane_point;
    let distance = to_point.dot(&normal);
    point - distance * normal
}

/// Compute angle between two vectors (in radians)
pub fn angle_between(v1: Vector3<f64>, v2: Vector3<f64>) -> f64 {
    let cos_angle = v1.normalize().dot(&v2.normalize()).clamp(-1.0, 1.0);
    cos_angle.acos()
}

/// Compute area of triangle
pub fn triangle_area(p0: Vector3<f64>, p1: Vector3<f64>, p2: Vector3<f64>) -> f64 {
    (p1 - p0).cross(&(p2 - p0)).norm() / 2.0
}

/// Barycentric interpolation
pub fn barycentric_interpolate(
    p0: Vector3<f64>,
    p1: Vector3<f64>,
    p2: Vector3<f64>,
    weights: [f64; 3],
) -> Vector3<f64> {
    p0 * weights[0] + p1 * weights[1] + p2 * weights[2]
}

/// Compute barycentric coordinates for point in triangle
pub fn compute_barycentric(
    point: Vector3<f64>,
    p0: Vector3<f64>,
    p1: Vector3<f64>,
    p2: Vector3<f64>,
) -> Option<[f64; 3]> {
    let v0 = p2 - p0;
    let v1 = p1 - p0;
    let v2 = point - p0;

    let dot00 = v0.dot(&v0);
    let dot01 = v0.dot(&v1);
    let dot02 = v0.dot(&v2);
    let dot11 = v1.dot(&v1);
    let dot12 = v1.dot(&v2);

    let inv_denom = 1.0 / (dot00 * dot11 - dot01 * dot01);
    let u = (dot11 * dot02 - dot01 * dot12) * inv_denom;
    let v = (dot00 * dot12 - dot01 * dot02) * inv_denom;

    if u >= 0.0 && v >= 0.0 && u + v <= 1.0 {
        Some([1.0 - u - v, v, u])
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_triangle_area() {
        let area = triangle_area(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
        );
        assert!((area - 0.5).abs() < 1e-10);
    }

    #[test]
    fn test_angle_between() {
        let v1 = Vector3::new(1.0, 0.0, 0.0);
        let v2 = Vector3::new(0.0, 1.0, 0.0);
        let angle = angle_between(v1, v2);
        assert!((angle - std::f64::consts::PI / 2.0).abs() < 1e-10);
    }
}
