export function openJson() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json, .json";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        try {
          resolve(JSON.parse(readerEvent.target.result));
        } catch (error) {
          reject(new Error(`Failed to parse JSON file: ${error.message}`));
        }
      };
      reader.onerror = (error) => {
        reject(new Error(`Failed to read file: ${error.message}`));
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export function writeJson(data, filename = "data.json") {
  const jsonString = JSON.stringify(data);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
