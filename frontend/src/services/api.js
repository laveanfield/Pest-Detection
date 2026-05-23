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
	const token = getToken();
	const headers = new Headers(options.headers || {});

	if (token && !headers.has("Authorization")) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	const response = await fetch(`${API_BASE}${path}`, {
		...options,
		headers,
	});

	if (response.status === 401) {
		clearToken();
		window.dispatchEvent(new Event("auth:logout"));
	}

	if (!response.ok) {
		throw new Error(await getErrorMessage(response));
	}
	return response.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function loginUser({ email, password }) {
	const params = new URLSearchParams({ email, password });
  	return apiRequest(`/auth/login?${params}`, { method: "POST" });
}

export async function registerUser({ username, email, password }) {
  	const params = new URLSearchParams({ username, email, password });
  	return apiRequest(`/auth/register?${params}`, { method: "POST" });
}

export async function verifyOtp({ email, otp }) {
  	const params = new URLSearchParams({ email, otp });
  	return apiRequest(`/auth/verify-register-otp?${params}`, { method: "POST" });
}

export async function forgotPassword({ email }) {
  	const params = new URLSearchParams({ email });
  	return apiRequest(`/auth/forgot-password?${params}`, { method: "POST" });
}

export async function resetPassword({ email, otp, new_password }) {
  	const params = new URLSearchParams({ email, otp, new_password });
  	return apiRequest(`/auth/reset-password?${params}`, { method: "POST" });
}

export async function getCurrentUser(token) {
  	return apiRequest("/auth/me", {
    	headers: { Authorization: `Bearer ${token}` },
  	});
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export const saveToken = (token) => localStorage.setItem("access_token", token);
export const getToken = () => localStorage.getItem("access_token");
export const clearToken = () => localStorage.removeItem("access_token");
