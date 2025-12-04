import React, { useRef, useState } from "react";

export default function FileUploader({ onFileChange }) {
  const fileInputRef = useRef(null);
  const [previewHTML, setPreviewHTML] = useState("");

  function generatePreview(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const csvContent = event.target.result;
      const rows = csvContent.trim().split("\n");
      if (rows.length === 0) return;
      const headers = rows[0].split(",");
      let html = "<table><thead><tr>";
      headers.forEach((h) => {
        html += `<th>${h.trim()}</th>`;
      });
      html += `</tr></thead><tbody>`;
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split(",");
        html += "<tr>";
        cells.forEach((c) => {
          html += `<td>${c.trim()}</td>`;
        });
        html += "</tr>";
      }
      html += `</tbody></table>`;
      setPreviewHTML(html);
    };
    reader.readAsText(file);
  }

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith(".csv")) {
      alert("Invalid file type. Please upload a .csv file.");
      onFileChange(null);
      setPreviewHTML("");
      return;
    }
    onFileChange(selectedFile);
    generatePreview(selectedFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  }

  return (
    <div className="upload-box-wrapper">
      <div className="upload-main-content">
        <div
          className="file-upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onDragEnter={(e) => e.preventDefault()}
        >
          <input
            type="file"
            name="marksheet"
            id="file"
            ref={fileInputRef}
            className="hidden-file"
            accept=".csv"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          <label htmlFor="file" className="custom-file-label">
            <div className="upload-content">
              <div className="upload-icon" />
              <div className="upload-text">
                <p>Drag & drop files here</p>
                <span>or</span>
                <p className="browse-files">Browse files</p>
              </div>
            </div>
          </label>
        </div>

        <div className="csv-preview-container" id="csvPreviewContainer">
          <p className="preview-title">File Preview</p>
          <div className="csv-preview-table-wrapper" id="csvPreviewTable" dangerouslySetInnerHTML={{ __html: previewHTML }} />
        </div>
      </div>

      <div className="upload-footer">
        <div className="file-note-wrapper">
          <img src="/assets/warn7.png" alt="Warning" className="warning-icon" />
          <div className="note-text-content">
            <p className="file-note">Note:</p>
            <p className="file-note1">Only .csv supported</p>
          </div>
        </div>
      </div>
    </div>
  );
}
