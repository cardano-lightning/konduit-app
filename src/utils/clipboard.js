export async function copy(text) {
  if (!navigator.clipboard) {
    alert(
      "Clipboard API not available. This may be due to an insecure context (not HTTPS).",
    );
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    alert("Failed to copy text: ", err);
    return false;
  }
}

export async function copySpan(event) {
  const elem = event.target;
  copy(elem.innerHTML).then((res) => {
    const cls = res ? "copy-ok" : "copy-ko";
    elem.classList.add(cls);
    setTimeout(() => elem.classList.remove(cls), 200);
  });
}
