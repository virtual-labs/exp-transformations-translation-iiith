### Procedure

1. **Navigating the Interface:**

   - The simulation interface is divided into three main sections:
     - Left panel: Display settings and shape controls
     - Center: 3D visualization area
     - Right panel: Transformation matrix and translation controls

2. **Display Settings (Left Panel):**

   - Use the checkboxes to control the simulation environment:
     - "Lock Graph": Prevents translation of the entire scene
     - "Lock Zoom": Disables zoom functionality
     - "Lock Rotate": Disables scene rotation
     - "XY-Grid", "YZ-Grid", "XZ-Grid": Toggle visibility of coordinate grids

3. **Shape Management:**

   - **Adding Shapes:**

     - Click the "Add" button
     - Select shape type (Cube, Tetrahedron, Octahedron)
     - Enter X, Y, Z coordinates
     - Click "Add" to create the shape

   - **Selecting Shapes:**

     - Click the "Select" button next to a shape in the shape list
     - The selected shape will be highlighted with a yellow outline
     - Only one shape can be selected at a time
     - The selected shape's coordinates will be displayed in the result coordinates panel

   - **Editing Shapes:**

     - Select a shape first
     - Click the "Edit" button
     - Modify the shape coordinates
     - Click "Edit" to apply changes

   - **Deleting Shapes:**
     - Select a shape first
     - Click the "Delete" button to remove it

4. **Translation Process:**

   - **Setting Translation Vector:**

     - Enter desired X, Y, Z values in the translation vector inputs
     - Click "Apply Translation" to set the translation parameters
     - The transformation matrix will update to reflect the translation

   - **Applying Translation:**
     - Ensure a shape is selected (yellow outline visible)
     - Move the slider to apply the translation
     - The selected shape will move according to the translation vector
     - The result coordinates will update in real-time
     - The transformation matrix will show the current transformation state

5. **Observing Results:**

   - **Coordinate Display:**

     - Initial coordinates are shown in the shape list
     - Result coordinates show the current position of the selected shape
     - All coordinates are displayed with 2 decimal places

   - **Transformation Matrix:**
     - Shows the 4x4 transformation matrix
     - Updates automatically when translation is applied
     - Values are displayed with 2 decimal places

6. **Reset and Cleanup:**
   - Click "Reset All" to:
     - Return all shapes to their initial positions
     - Clear the translation vector
     - Reset the transformation matrix
     - Deselect any selected shapes

**Important Notes:**

- Always select a shape before attempting translation
- The slider must be at zero before making changes to the translation vector
- The yellow outline indicates the currently selected shape
- Only the selected shape will move during translation
- For best results, use a desktop screen as the simulation is optimized for larger displays

**Expected Outcomes:**

- When a shape is selected, it will be highlighted with a yellow outline
- Moving the slider will only affect the selected shape
- The result coordinates will update in real-time during translation
- The transformation matrix will reflect the current translation state
- The shape list will show the current positions of all shapes
