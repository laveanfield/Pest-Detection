import { useState, useCallback } from "react";
import {
    loginUser,
    registerUser,
    verifyOtp,
    forgotPassword,
    resetPassword,
    saveToken,
    clearToken,
    getToken,
} from "../services/api";

export function useLogin(onSuccess) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = useCallback(
        async ({ email, password }) => {
        setLoading(true);
        setError("");
        try {
            const data = await loginUser({ email, password });
            saveToken(data.access_token);
            onSuccess?.(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        },
        [onSuccess]
    );

    return { submit, loading, error, setError };
}

export function useRegister(onOtpRequired) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = useCallback(
        async ({ username, email, password }) => {
        setLoading(true);
        setError("");
        try {
            await registerUser({ username, email, password });
            // Backend sends OTP — move to verification step
            onOtpRequired?.(email);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        },
        [onOtpRequired]
    );

    return { submit, loading, error, setError };
}

export function useVerifyOtp(onSuccess) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = useCallback(
        async ({ email, otp }) => {
        setLoading(true);
        setError("");
        try {
            await verifyOtp({ email, otp });
            onSuccess?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        },
        [onSuccess]
    );

    return { submit, loading, error, setError };
}

export function useForgotPassword(onOtpSent) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = useCallback(
        async ({ email }) => {
        setLoading(true);
        setError("");
        try {
            await forgotPassword({ email });
            onOtpSent?.(email);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        },
        [onOtpSent]
    );

    return { submit, loading, error, setError };
}

export function useResetPassword(onSuccess) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = useCallback(
        async ({ email, otp, new_password }) => {
        setLoading(true);
        setError("");
        try {
            await resetPassword({ email, otp, new_password });
            onSuccess?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        },
        [onSuccess]
    );

    return { submit, loading, error, setError };
}

export function useLogout(onLogout) {
    return useCallback(() => {
        clearToken();
        onLogout?.();
    }, [onLogout]);
}

export const isAuthenticated = () => Boolean(getToken());
