const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const getErrorMessage = async (response) => {
	try {
		const payload = await response.json();
		if (typeof payload.detail === "string") return payload.detail;
		if (Array.isArray(payload.detail)) return payload.detail.map((item) => item.msg).join(", ");
	} catch {
		// fallthrough
	}
	return `Request failed with status ${response.status}`;
};

export async function apiRequest(path, options = {}) {
	const response = await fetch(`${API_BASE}${path}`, options);
	if (!response.ok) {
		throw new Error(await getErrorMessage(response));
	}
	return response.json();
}
