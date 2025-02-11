export async function fetchJSON(url: string) {
    const response = await fetch(url);
    return await response.json();
}
