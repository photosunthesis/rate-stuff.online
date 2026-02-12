import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { activityKeys } from "~/domains/activity/queries";

const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

export function useActivitySocket(userId: string | undefined) {
	const queryClient = useQueryClient();
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
	const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const cleanup = useCallback(() => {
		if (reconnectTimerRef.current) {
			clearTimeout(reconnectTimerRef.current);
			reconnectTimerRef.current = null;
		}
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!userId || typeof window === "undefined") return;

		let stopped = false;

		function connect() {
			if (stopped) return;

			const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
			const url = `${protocol}//${window.location.host}/ws/activity/${userId}`;

			const ws = new WebSocket(url);
			wsRef.current = ws;

			ws.addEventListener("open", () => {
				reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
			});

			ws.addEventListener("message", (event) => {
				if (event.data === "NEW_ACTIVITY") {
					queryClient.invalidateQueries({ queryKey: activityKeys.all });
				}
			});

			ws.addEventListener("close", () => {
				if (stopped) return;
				reconnectTimerRef.current = setTimeout(() => {
					reconnectTimerRef.current = null;
					reconnectDelayRef.current = Math.min(
						reconnectDelayRef.current * 2,
						MAX_RECONNECT_DELAY,
					);
					connect();
				}, reconnectDelayRef.current);
			});

			ws.addEventListener("error", () => {
				ws.close();
			});
		}

		connect();

		return () => {
			stopped = true;
			cleanup();
		};
	}, [userId, queryClient, cleanup]);
}
