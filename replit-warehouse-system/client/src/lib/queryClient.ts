import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = `${res.status}: ${res.statusText}`;
    try {
      // Response를 한 번만 읽기 위해 clone 사용
      const resClone = res.clone();
      const json = await resClone.json();
      errorMessage = json.message || json.error || errorMessage;
    } catch (parseError) {
      try {
        const text = await res.text();
        if (text) errorMessage = `${res.status}: ${text}`;
      } catch (textError) {
        // 이미 읽힌 경우 기본 메시지 사용
      }
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add session ID to headers if available
  const sessionId = localStorage.getItem('warehouse_session');
  if (sessionId) {
    headers["x-session-id"] = sessionId;
  }

  console.log('API request:', { method, url });

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-cache",
  });

  console.log('API response:', { status: res.status, statusText: res.statusText, url });
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const sessionId = localStorage.getItem('warehouse_session');
    const headers: Record<string, string> = {};
    
    if (sessionId) {
      headers["x-session-id"] = sessionId;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
