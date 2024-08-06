# User Stories for Image Preview Feature

## 1. Preview Modal Display

**As a user**, I want to see a preview modal when I click the camera button, so that I can review the map image before exporting it.

**Example**:

- When I click the camera button in the toolbar, a modal immediately appears showing a preview of the entire US map with my current county selections and color scheme.
- The preview modal includes the title "Export Preview" and shows the full map, including Alaska and Hawaii.

## 2. Key Map Inclusion

**As a user**, I want the preview to include the key map if I've made it visible on the main map, so that I can export a complete representation of my work.

**Example**:

- If I've clicked the "Key Map" button to display the color key on the main map, the preview modal shows the entire US map on the left and the color key on the right, just as it appears in the main view.
- If the key map is hidden, the preview only shows the US map without any key.

## 3. Format Selection

**As a user**, I want to be able to switch between PNG and JPG formats in the preview modal, so that I can choose the best format for my needs.

**Example**:

- The preview modal includes radio buttons or a dropdown menu labeled "Format: PNG / JPG".
- When I switch from PNG to JPG, the preview image updates to reflect the JPG format (which might show slight differences in color or clarity compared to PNG).

## 4. Download Button

**As a user**, I want a prominent "Download" button in the preview modal, so that I can easily export the map once I'm satisfied with the preview.

**Example**:

- The preview modal has a large, clearly labeled "Download" button at the bottom.
- When I click the "Download" button, the browser immediately starts downloading the map image in the selected format (PNG or JPG).

## 5. Consistent Map Rendering

**As a user**, I want the preview to accurately reflect what will be downloaded, including all my selections and the current state of the map.

**Example**:

- If I've colored California red, Texas blue, and Florida green, the preview shows these exact colors in the correct locations.
- If I've zoomed in on the East Coast in the main view, the preview still shows the entire US map with my color selections intact.

## 6. Modal Closing

**As a user**, I want to be able to close the preview modal without downloading, so that I can return to editing my map if needed.

**Example**:

- The preview modal includes a "Close" button and an "X" in the top-right corner.
- Clicking either the "Close" button, the "X", or anywhere outside the modal dismisses the preview without downloading the image.

## 7. Preview Loading Indication

**As a user**, I want to see a loading indicator while the preview is being generated, so that I know the system is working on creating my preview.

**Example**:

- After clicking the camera button, a spinner or progress bar appears in the center of the screen.
- Once the preview is ready, the spinner is replaced by the preview modal with the map image.

## Files to be Created or Modified

### New Files

1. `imagePreview.js`
   - Purpose: Handle the logic for generating and displaying the image preview

### Existing Files to be Modified

1. `index.html`
   - Changes: Add HTML structure for the preview modal

2. `main.js`
   - Changes: Import and initialize the new image preview functionality

3. `cameraButton.js`
   - Changes: Modify click event to show the preview modal instead of directly exporting

4. `exportPng.js`
   - Changes: Modify to support generating a preview without downloading

5. `exportJpg.js`
   - Changes: Modify to support generating a preview without downloading

6. `style.css`
   - Changes: Add styles for the new preview modal and its components

7. `contextMenuUtils.js`
   - Changes: Update to handle new preview-related context menu options if necessary

8. `customAlerts.js`
   - Changes: Add new alert types or messages related to the preview functionality if needed

This list covers the main files that will likely need to be created or modified to implement the image preview feature. The exact changes may vary as the implementation progresses, but this provides a solid starting point for the development process.
