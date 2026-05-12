# TSplineForge Editor QA Test Plan

## Overview
Comprehensive test plan for editor functionality including import, selection, transforms, materials, operations, undo/redo, and export.

---

## Test Environment Setup
- **Browser**: Chrome/Firefox/Safari
- **Resolution**: 1280x800 (desktop)
- **Build**: `pnpm build` (production)
- **Dev Server**: `pnpm dev` (if testing locally)

---

## Test Cases

### 1. IMPORT WORKFLOW
**Goal**: Verify file import functionality loads 3D models correctly

#### 1.1 Import OBJ File
- [ ] Navigate to `/editor`
- [ ] Click "Import" button in header
- [ ] Select a test OBJ file (max 100MB)
- [ ] **Expected**: Modal opens with format info
- [ ] **Expected**: File appears in viewport with correct geometry
- [ ] **Expected**: Mesh statistics show vertex/face counts
- [ ] **Expected**: Toast notification appears with model info
- [ ] **Expected**: Model is automatically selected

#### 1.2 Import STL File
- [ ] Click "Import" button
- [ ] Select test.stl file
- [ ] **Expected**: File loads correctly
- [ ] **Expected**: Geometry displays with smooth shading

#### 1.3 Import GLTF/GLB File
- [ ] Click "Import" button
- [ ] Select test.gltf or test.glb file
- [ ] **Expected**: Model with materials loads correctly
- [ ] **Expected**: Colors/materials preserved if applicable

#### 1.4 Import Error Handling
- [ ] Try importing unsupported format (.txt)
- [ ] **Expected**: Error message: "Unsupported format"
- [ ] Try importing file >100MB
- [ ] **Expected**: Error message: "File too large"
- [ ] Try importing empty file
- [ ] **Expected**: Error message: "Invalid file"

#### 1.5 Multiple Imports
- [ ] Import first model
- [ ] Import second model
- [ ] **Expected**: Second model appears alongside first
- [ ] **Expected**: Both models visible in viewport

---

### 2. SELECTION SYSTEM
**Goal**: Verify mesh selection and visual feedback

#### 2.1 Click to Select
- [ ] Import a model
- [ ] Click on the model in viewport
- [ ] **Expected**: Model highlights (emissive glow)
- [ ] **Expected**: Properties panel populates with mesh data
- [ ] **Expected**: Model name appears in header
- [ ] **Expected**: Quick action buttons show (Duplicate, Delete, Reset)

#### 2.2 Deselect
- [ ] With model selected, click on empty space in viewport
- [ ] **Expected**: Model highlight disappears
- [ ] **Expected**: Properties panel shows "Click on a mesh to edit"
- [ ] **Expected**: Quick action buttons disappear

#### 2.3 Multi-Click Selection
- [ ] Import multiple models
- [ ] Click model 1
- [ ] **Expected**: Model 1 is selected and highlighted
- [ ] Click model 2
- [ ] **Expected**: Model 1 deselects, model 2 selects

#### 2.4 Selection with Properties
- [ ] Select a model
- [ ] Change a property (color, position, etc.)
- [ ] **Expected**: Change is reflected immediately in viewport
- [ ] **Expected**: Property panel shows updated value

---

### 3. TRANSFORM OPERATIONS
**Goal**: Verify Move, Rotate, Scale functionality

#### 3.1 Move (G Key + Drag)
- [ ] Import model
- [ ] Select model (click it)
- [ ] Press "G" key (or click Move button in toolbar)
- [ ] **Expected**: Transform mode indicator shows "Move"
- [ ] Drag mouse left/right
- [ ] **Expected**: Model moves along X axis
- [ ] Drag mouse up/down
- [ ] **Expected**: Model moves along Y axis
- [ ] Release mouse (or press Escape)
- [ ] **Expected**: Transform committed to history

#### 3.2 Rotate (R Key + Drag)
- [ ] Select model
- [ ] Press "R" key (or click Rotate button)
- [ ] **Expected**: Transform mode shows "Rotate"
- [ ] Drag horizontally
- [ ] **Expected**: Model rotates around Y axis
- [ ] Drag vertically
- [ ] **Expected**: Model rotates around X axis
- [ ] Release or press Escape
- [ ] **Expected**: Rotation committed

#### 3.3 Scale (S Key + Drag)
- [ ] Select model
- [ ] Press "S" key
- [ ] **Expected**: Transform mode shows "Scale"
- [ ] Drag right
- [ ] **Expected**: Model scales larger (uniform)
- [ ] Drag left
- [ ] **Expected**: Model scales smaller (min 0.1)
- [ ] Release or press Escape
- [ ] **Expected**: Scale committed

#### 3.4 Property Panel Transforms
- [ ] Select model
- [ ] Open "Transform" tab in Properties panel
- [ ] Change Position X to 5
- [ ] **Expected**: Model moves right in viewport
- [ ] Change Rotation Y to 45
- [ ] **Expected**: Model rotates in viewport
- [ ] Change Scale Z to 2
- [ ] **Expected**: Model stretches on Z axis
- [ ] All changes go to undo history

#### 3.5 Transform with Keyboard (Numbers)
- [ ] Select model
- [ ] In Properties panel, change Position X: 10, Y: 5, Z: 2
- [ ] **Expected**: Model positioned at (10, 5, 2)
- [ ] Verify in viewport position matches
- [ ] Change Rotation X: 90 (degrees)
- [ ] **Expected**: Model rotated 90° around X
- [ ] Change Scale to 2, 2, 2
- [ ] **Expected**: Model uniformly scaled 2x

#### 3.6 Reset Transform
- [ ] Move/rotate/scale a model
- [ ] Click "Reset" button in Properties > Transform
- [ ] **Expected**: Position: 0, 0, 0
- [ ] **Expected**: Rotation: 0, 0, 0
- [ ] **Expected**: Scale: 1, 1, 1
- [ ] **Expected**: Model returns to origin

---

### 4. MATERIAL EDITING
**Goal**: Verify color and material property updates

#### 4.1 Color Picker
- [ ] Select model
- [ ] Open "Material" tab in Properties
- [ ] Click color picker
- [ ] **Expected**: Color input opens
- [ ] Select a different color (e.g., red)
- [ ] **Expected**: Model updates to red immediately
- [ ] Color value shows in hex input

#### 4.2 Color Input (Hex)
- [ ] In Material tab, find Color input
- [ ] Type "#ff00ff" (magenta)
- [ ] Press Enter
- [ ] **Expected**: Model updates to magenta
- [ ] **Expected**: Color picker shows magenta

#### 4.3 Opacity Slider
- [ ] In Material tab, find Opacity slider
- [ ] Set to 0.5
- [ ] **Expected**: Model becomes 50% transparent
- [ ] Set to 0.2
- [ ] **Expected**: Model very transparent
- [ ] Set to 1.0
- [ ] **Expected**: Model fully opaque

#### 4.4 Roughness Slider
- [ ] Set Roughness to 0 (shiny)
- [ ] **Expected**: Model is highly reflective/glossy
- [ ] Set Roughness to 1 (matte)
- [ ] **Expected**: Model is completely matte

#### 4.5 Metalness Slider
- [ ] Set Metalness to 0
- [ ] **Expected**: Model non-metallic appearance
- [ ] Set Metalness to 1
- [ ] **Expected**: Model has metallic appearance
- [ ] Adjust Roughness while metallic
- [ ] **Expected**: Different reflections

#### 4.6 Material Presets
- [ ] Select model
- [ ] In Material tab, click "metallic" preset
- [ ] **Expected**: Color changes to metallic gray
- [ ] **Expected**: Roughness: 0.2, Metalness: 1
- [ ] Try "plastic" preset
- [ ] **Expected**: Appropriate plastic appearance
- [ ] Try "glass" preset
- [ ] **Expected**: Transparent with appropriate reflections

---

### 5. MESH OPERATIONS
**Goal**: Verify duplicate, delete, reset operations

#### 5.1 Duplicate Operation
- [ ] Select model
- [ ] Click "Duplicate" button (or Shift+D)
- [ ] **Expected**: Second identical model appears offset by 1 unit on X
- [ ] **Expected**: New model is automatically selected
- [ ] **Expected**: Model name shows "(Copy)"
- [ ] **Expected**: Changes to original don't affect copy

#### 5.2 Delete Operation
- [ ] Select duplicated model
- [ ] Click "Delete" button (or press Delete key)
- [ ] **Expected**: Model disappears from viewport
- [ ] **Expected**: Selection clears
- [ ] **Expected**: Toast notification: "Mesh deleted"

#### 5.3 Delete Last Mesh
- [ ] Import one model
- [ ] Select it
- [ ] Delete it
- [ ] **Expected**: Viewport is empty
- [ ] **Expected**: Properties panel shows "Click on a mesh to edit"

#### 5.4 Visibility Toggle
- [ ] Select model
- [ ] In Properties > Info tab, click Eye icon
- [ ] **Expected**: Model disappears (but still selected)
- [ ] Click Eye icon again
- [ ] **Expected**: Model reappears
- [ ] **Expected**: Badge shows "Visible: No" when hidden

#### 5.5 Transform Space Toggle
- [ ] Select model
- [ ] In Properties > Info tab, click "World" button
- [ ] **Expected**: Button changes to "Local"
- [ ] **Expected**: Transforms now use local coordinates
- [ ] Click again
- [ ] **Expected**: Returns to "World"

---

### 6. UNDO/REDO SYSTEM
**Goal**: Verify command history works correctly

#### 6.1 Undo Single Operation
- [ ] Import model
- [ ] Move model with G key
- [ ] Press Ctrl+Z
- [ ] **Expected**: Model returns to previous position
- [ ] Undo button becomes disabled (no more history)

#### 6.2 Undo Multiple Operations
- [ ] Import model
- [ ] Move it (G)
- [ ] Rotate it (R)
- [ ] Scale it (S)
- [ ] Change color
- [ ] Press Ctrl+Z 4 times
- [ ] **Expected**: Each Ctrl+Z undoes one operation
- [ ] **Expected**: Model returns to original state

#### 6.3 Redo Operations
- [ ] With undone history, press Ctrl+Shift+Z
- [ ] **Expected**: Most recent undone operation re-applies
- [ ] Press Ctrl+Shift+Z again
- [ ] **Expected**: Next operation re-applies
- [ ] Continue until all operations redone

#### 6.4 History Limits
- [ ] Make 55 changes (beyond 50-item limit)
- [ ] **Expected**: Only last 50 are undoable
- [ ] **Expected**: Cannot undo past 50 items

#### 6.5 Undo/Redo Buttons
- [ ] Make some changes
- [ ] Click Undo button in toolbar
- [ ] **Expected**: Operation undoes
- [ ] **Expected**: Redo button becomes enabled
- [ ] Click Redo button
- [ ] **Expected**: Operation re-applies

#### 6.6 History Clears on New Action
- [ ] Make changes, undo some
- [ ] Make a new change (not redo)
- [ ] **Expected**: Redo stack clears
- [ ] **Expected**: Cannot redo anymore

---

### 7. PROPERTY PANEL SYNCHRONIZATION
**Goal**: Verify property panel reflects and updates model state

#### 7.1 Panel Shows Correct Values
- [ ] Import model
- [ ] Select it
- [ ] **Expected**: Transform tab shows Position: 0, 0, 0
- [ ] **Expected**: Rotation: 0, 0, 0
- [ ] **Expected**: Scale: 1, 1, 1
- [ ] **Expected**: Material tab shows default color/properties

#### 7.2 External Changes Update Panel
- [ ] Select model
- [ ] Move model with G key + drag
- [ ] **Expected**: Position values in panel update to new position
- [ ] Change color via color picker
- [ ] **Expected**: Hex input shows new color value

#### 7.3 Panel Changes Update Viewport
- [ ] Select model
- [ ] In Properties, change Position X to 10
- [ ] **Expected**: Model immediately moves in viewport
- [ ] Change Rotation Y to 45
- [ ] **Expected**: Model immediately rotates
- [ ] All changes sync to viewport instantly

#### 7.4 Info Tab Statistics
- [ ] Select model
- [ ] Open Properties > Info tab
- [ ] **Expected**: Shows mesh name
- [ ] **Expected**: Shows visibility status
- [ ] **Expected**: Shows transform mode (World/Local)
- [ ] **Expected**: Shows space type

---

### 8. EXPORT WORKFLOW
**Goal**: Verify export system with formats and options

#### 8.1 Export Dialog Opens
- [ ] Load model in editor
- [ ] Click "Export" button
- [ ] **Expected**: AdvancedExportDialog opens
- [ ] **Expected**: Shows mesh statistics (vertices, faces)
- [ ] **Expected**: Format cards visible

#### 8.2 Format Selection (STL)
- [ ] In export dialog, click STL format card
- [ ] **Expected**: Format is highlighted/selected
- [ ] **Expected**: STL-specific options show (Binary/ASCII)
- [ ] Default filename shows *.stl extension
- [ ] Click "Export & Download"
- [ ] **Expected**: File downloads as .stl

#### 8.3 Format Selection (GLTF)
- [ ] Click GLTF format card
- [ ] **Expected**: GLTF options visible
- [ ] **Expected**: Checkboxes for Geometry, Materials, Animations
- [ ] Change filename to "mymodel.gltf"
- [ ] Export
- [ ] **Expected**: File downloads as .gltf

#### 8.4 Export Statistics Display
- [ ] Open export dialog
- [ ] **Expected**: "Mesh Statistics" section shows:
  - Vertices count
  - Faces count
  - Bounding box dimensions
- [ ] **Expected**: Status shows "Ready for export" (green)

#### 8.5 Export Options
- [ ] Select a format
- [ ] Check/uncheck "Preserve Colors"
- [ ] **Expected**: Option state persists while dialog open
- [ ] Check/uncheck "Preserve Materials"
- [ ] **Expected**: Option state changes

#### 8.6 Export History
- [ ] Expand "Export History" section
- [ ] Export a model (creates history entry)
- [ ] **Expected**: Entry shows filename, format, size, time
- [ ] Export another model
- [ ] **Expected**: Appears in history
- [ ] Click "Clear History"
- [ ] **Expected**: History empties

#### 8.7 Invalid State Handling
- [ ] Create empty scene (delete all meshes)
- [ ] Try to open export dialog
- [ ] **Expected**: Either disabled or shows error

---

### 9. KEYBOARD SHORTCUTS
**Goal**: Verify all keyboard shortcuts work

#### 9.1 Transform Shortcuts
- [ ] Select model
- [ ] Press "G" → Move mode
- [ ] Press "R" → Rotate mode
- [ ] Press "S" → Scale mode
- [ ] Press "Escape" → Exit mode
- [ ] All work as expected

#### 9.2 Operation Shortcuts
- [ ] Select model
- [ ] Press "Delete" → Model deletes
- [ ] Undo with Ctrl+Z
- [ ] Press "Shift+D" → Duplicate
- [ ] **Expected**: Copy created

#### 9.3 History Shortcuts
- [ ] Make changes
- [ ] Press "Ctrl+Z" → Undo
- [ ] Press "Ctrl+Shift+Z" → Redo
- [ ] Both work correctly

#### 9.4 Conflict Resolution
- [ ] In input field, type "g"
- [ ] **Expected**: Doesn't trigger move mode
- [ ] Press Escape to exit field
- [ ] Press "G"
- [ ] **Expected**: Now enters move mode

---

### 10. EDGE CASES & ERROR HANDLING
**Goal**: Verify robustness and error handling

#### 10.1 Empty Viewport
- [ ] Navigate to editor (no model loaded)
- [ ] **Expected**: Viewport shows grid
- [ ] **Expected**: Properties panel shows "Click on a mesh to edit"
- [ ] **Expected**: No errors in console

#### 10.2 Large File Handling
- [ ] Try to import file >100MB
- [ ] **Expected**: Error message appears
- [ ] File is not imported

#### 10.3 Unsupported Format
- [ ] Try to import .pdf or .txt
- [ ] **Expected**: Error: "Unsupported format"

#### 10.4 Rapid Clicks
- [ ] Click mesh multiple times rapidly
- [ ] **Expected**: Stays selected
- [ ] **Expected**: No errors or crashes

#### 10.5 Rapid Transform Operations
- [ ] Use G/R/S keys rapidly multiple times
- [ ] **Expected**: Smooth handling
- [ ] **Expected**: No UI freezing

#### 10.6 Property Input Validation
- [ ] In Position X, type "abc"
- [ ] **Expected**: Input doesn't accept non-numeric
- [ ] Type "-1000"
- [ ] **Expected**: Accepts negative values
- [ ] Type "0.001"
- [ ] **Expected**: Accepts decimals

#### 10.7 Browser Console
- [ ] Open DevTools Console
- [ ] Perform all operations above
- [ ] **Expected**: No errors logged
- [ ] **Expected**: No warnings except pre-existing ones

---

## Test Results Summary

### Import Tests
- [ ] OBJ import: **PASS** / FAIL
- [ ] STL import: **PASS** / FAIL
- [ ] GLTF import: **PASS** / FAIL
- [ ] Error handling: **PASS** / FAIL
- [ ] Multi-import: **PASS** / FAIL

### Selection Tests
- [ ] Click select: **PASS** / FAIL
- [ ] Deselect: **PASS** / FAIL
- [ ] Multi-select: **PASS** / FAIL
- [ ] Properties sync: **PASS** / FAIL

### Transform Tests
- [ ] Move (G+Drag): **PASS** / FAIL
- [ ] Rotate (R+Drag): **PASS** / FAIL
- [ ] Scale (S+Drag): **PASS** / FAIL
- [ ] Property inputs: **PASS** / FAIL
- [ ] Reset: **PASS** / FAIL

### Material Tests
- [ ] Color picker: **PASS** / FAIL
- [ ] Opacity: **PASS** / FAIL
- [ ] Roughness: **PASS** / FAIL
- [ ] Metalness: **PASS** / FAIL
- [ ] Presets: **PASS** / FAIL

### Operations Tests
- [ ] Duplicate: **PASS** / FAIL
- [ ] Delete: **PASS** / FAIL
- [ ] Visibility: **PASS** / FAIL
- [ ] Transform space: **PASS** / FAIL

### Undo/Redo Tests
- [ ] Single undo: **PASS** / FAIL
- [ ] Multiple undo: **PASS** / FAIL
- [ ] Redo: **PASS** / FAIL
- [ ] History limit: **PASS** / FAIL

### Export Tests
- [ ] Dialog opens: **PASS** / FAIL
- [ ] Format selection: **PASS** / FAIL
- [ ] Download: **PASS** / FAIL
- [ ] History: **PASS** / FAIL

### Keyboard Tests
- [ ] Transform shortcuts: **PASS** / FAIL
- [ ] Operation shortcuts: **PASS** / FAIL
- [ ] History shortcuts: **PASS** / FAIL

### Overall Result: **PASS** / **FAIL**

---

## Known Issues / Blockers
(To be filled during testing)

---

## Performance Notes
- Load time for 1MB model: _____ ms
- Transform responsiveness: ✓ Smooth / ⚠ Laggy / ✗ Jittery
- Material update lag: ✓ Instant / ⚠ <100ms / ✗ >100ms
- Console memory: _____ MB
- FPS during interaction: _____ fps

---

## Sign-Off
- Tested by: _______
- Date: _______
- Status: **READY FOR PRODUCTION** / **NEEDS FIXES**

---
