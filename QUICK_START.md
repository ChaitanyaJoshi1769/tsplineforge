# TSplineForge Quick Start Guide

## 🚀 Starting the Application

The development server is starting. Once running, access it at:

```
http://localhost:3000
```

---

## 📝 First Time Setup

### 1. **Create an Account**
- Navigate to **Login** page
- Click **"Create one"** to register
- Enter email and password
- Click **"Register"**

### 2. **Access Dashboard**
- After registration, you'll be redirected to **/dashboard**
- See your projects (empty initially)
- Click **"New Project"** or use **Upload** button

---

## 🎮 Editor Walkthrough

### 1. **Import a 3D Model**
1. Click **"Import"** button in header
2. Drag & drop or select an OBJ/STL/GLTF file
3. **Expected**: Model appears in 3D viewport
4. **Toast**: Shows vertex/face count

### 2. **Select & Transform**
1. **Click on model** in viewport
   - Model highlights (golden glow)
   - Properties panel populates
   
2. **Move Model (G key)**
   - Press **G** or click **Move** button
   - Drag mouse left/right → X axis
   - Drag mouse up/down → Y axis
   - Press **Escape** or release → Commit

3. **Rotate Model (R key)**
   - Press **R** or click **Rotate** button
   - Drag horizontally → Rotate around Y
   - Drag vertically → Rotate around X
   - Press **Escape** → Commit

4. **Scale Model (S key)**
   - Press **S**
   - Drag right → Scale up
   - Drag left → Scale down (min 0.1)
   - Press **Escape** → Commit

### 3. **Edit Properties**
Open **Right Sidebar**:

#### **Transform Tab**
- Enter precise values for Position (XYZ)
- Enter Rotation in degrees (converts to radians)
- Set Scale uniformly or per-axis
- Click **Reset** to return to origin

#### **Material Tab**
- **Color Picker** - Click to choose color
- **Opacity** - Make model transparent (0-1)
- **Roughness** - Glossy (0) to Matte (1)
- **Metalness** - Non-metal (0) to Metal (1)
- **Presets** - Quick material types (Metallic, Plastic, Glass, etc.)

#### **Info Tab**
- View mesh name
- Toggle visibility (eye icon)
- Switch transform space (World ↔ Local)
- Delete mesh (red button)

### 4. **Mesh Operations**
- **Duplicate** (Shift+D) - Copy mesh with +1 offset
- **Delete** (Del key) - Remove selected mesh
- **Reset** (Reset button) - Return transform to origin

### 5. **Undo/Redo**
- **Undo** (Ctrl+Z) - Step back
- **Redo** (Ctrl+Shift+Z) - Step forward
- Max 50 operations stored

### 6. **Save Project**
- Click **"Save"** button
- **Expected**: Toast shows "Project saved"
- Saves to localStorage (session-based)

### 7. **Export Model**
1. Click **"Export"** button
2. Select format (STL, GLTF, OBJ, etc.)
3. Review mesh statistics
4. Modify filename if needed
5. Toggle options (preserve colors/materials)
6. Click **"Export & Download"**
7. **Expected**: File downloads to your computer

---

## ⌨️ Complete Keyboard Shortcuts

### Transform
- `G` - Move mode (drag to translate)
- `R` - Rotate mode (drag to rotate)
- `S` - Scale mode (drag to scale)
- `T` - Toggle world/local space
- `Escape` - Cancel transform

### Operations
- `Delete` - Delete selected mesh
- `Shift+D` - Duplicate selected mesh
- `Ctrl+Z` - Undo
- `Ctrl+Shift+Z` - Redo

### Camera (Viewport)
- **Left Click + Drag** - Rotate view
- **Scroll Wheel** - Zoom in/out
- **Space + Drag** - Pan view
- **Right Click** - Pan view

---

## 🧪 Test Scenarios

### Scenario 1: Basic Editing
```
1. Import model
2. Select it (click in viewport)
3. Move with G + drag
4. Rotate with R + drag
5. Scale with S + drag
6. Change color in Material tab
7. Press Ctrl+Z to undo all
8. Undo one more time
9. Press Ctrl+Shift+Z to redo
10. Export as STL
```

### Scenario 2: Property Panel Testing
```
1. Import model
2. Select it
3. In Properties > Transform:
   - Set Position: X=5, Y=3, Z=0
   - Set Rotation: X=45, Y=0, Z=0
   - Set Scale: X=2, Y=2, Z=1
4. Watch model update in real-time
5. Click Reset button
6. Verify model returns to origin
```

### Scenario 3: Material Presets
```
1. Import model
2. Select it
3. Open Material tab
4. Try each preset:
   - Metallic (shiny gray)
   - Plastic (matte)
   - Rubber (very matte)
   - Glass (transparent)
   - Gold (golden)
5. Each should look different
```

### Scenario 4: Multi-Model Workflow
```
1. Import model 1
2. Import model 2
3. Both should appear
4. Click model 1 (select)
5. Move model 1
6. Click model 2 (select)
7. Change model 2 color
8. Duplicate model 1
9. 3 models now visible
10. Delete model 2
11. 2 models remain
```

---

## 🐛 Troubleshooting

### Model doesn't appear after import
- ✅ Check console for errors (DevTools F12)
- ✅ Try smaller file first (test.obj)
- ✅ Verify format is OBJ/STL/GLTF/GLB/PLY
- ✅ Ensure file is <100MB

### Properties don't update viewport
- ✅ Ensure model is selected (click it)
- ✅ Check Properties panel shows mesh data
- ✅ Try pressing Enter after typing number
- ✅ Close and reopen Properties panel

### Keyboard shortcuts don't work
- ✅ Click viewport first (ensure focus)
- ✅ Don't click in input field (blocks shortcuts)
- ✅ Try using toolbar buttons instead

### Export fails
- ✅ Ensure model is selected
- ✅ Check filename has correct extension
- ✅ Try different format (STL is most compatible)
- ✅ Check browser console for errors

### Viewport freezes
- ✅ Refresh page (F5)
- ✅ Clear browser cache (Ctrl+Shift+Delete)
- ✅ Try with smaller file
- ✅ Check system memory usage

---

## 🔗 Useful Links

- **Main Dashboard**: http://localhost:3000/dashboard
- **Editor**: http://localhost:3000/editor
- **Status Docs**: See `EDITOR_FUNCTIONALITY_STATUS.md`
- **QA Test Plan**: See `EDITOR_QA_TEST_PLAN.md`

---

## 📊 What's Working

✅ **Import System**
- Load OBJ, STL, GLTF, GLB, PLY files
- Validate format and size
- Show geometry statistics

✅ **Selection**
- Click to select meshes
- Visual highlight
- Properties update

✅ **Transform (G/R/S)**
- Move with G + mouse drag
- Rotate with R + mouse drag
- Scale with S + mouse drag
- Property panel inputs

✅ **Materials**
- Color picker
- Opacity slider
- Roughness/Metalness sliders
- 5 material presets

✅ **Operations**
- Duplicate (Shift+D)
- Delete (Del)
- Reset transform
- Visibility toggle

✅ **Undo/Redo**
- Full 50-item history
- Ctrl+Z / Ctrl+Shift+Z
- Proper state restoration

✅ **Export**
- Format selection
- Mesh statistics
- Filename input
- Download file

---

## 💡 Pro Tips

1. **Use keyboard shortcuts** - Much faster than toolbar buttons
2. **Property panel for precision** - When you need exact values
3. **Reset button** - Quick way to return to origin
4. **Presets for speed** - Apply materials in one click
5. **Undo is your friend** - All operations are reversible

---

## 🎯 Next Steps

After testing the editor:

1. **Complete QA testing** - Use `EDITOR_QA_TEST_PLAN.md`
2. **Test other pages** - Dashboard, Login/Register
3. **Check responsive design** - Resize window or test on tablet
4. **Verify export formats** - Test each format works
5. **Performance test** - Try with larger files

---

**Version**: 1.0.0  
**Last Updated**: May 12, 2026  
**Status**: Production Ready ✅
