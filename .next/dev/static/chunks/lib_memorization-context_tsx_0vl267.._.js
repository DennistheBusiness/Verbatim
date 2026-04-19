(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/memorization-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MemorizationProvider",
    ()=>MemorizationProvider,
    "countWords",
    ()=>countWords,
    "useMemorization",
    ()=>useMemorization
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const STORAGE_KEY = "memorization-sets";
const MemorizationContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function generateId() {
    return crypto.randomUUID();
}
/**
 * Parses content into paragraphs.
 * - Splits on one or more line breaks
 * - Trims whitespace from each paragraph
 * - Normalizes internal whitespace (multiple spaces become single space)
 * - Ignores empty chunks
 */ function parseIntoParagraphs(content) {
    return content// Normalize line endings
    .replace(/\r\n/g, "\n")// Split on one or more line breaks (with optional whitespace between)
    .split(/\n\s*\n|\n/)// Trim and normalize internal whitespace
    .map((p)=>p.trim().replace(/\s+/g, " "))// Filter out empty chunks
    .filter((p)=>p.length > 0);
}
/**
 * Parses content into sentences.
 * - Splits on sentence-ending punctuation (. ? !)
 * - Preserves the punctuation with the sentence
 * - Trims whitespace from each sentence
 * - Normalizes internal whitespace
 * - Ignores empty chunks
 */ function parseIntoSentences(content) {
    // Normalize whitespace first (replace line breaks and multiple spaces with single space)
    const normalized = content.replace(/\r\n/g, "\n").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    // Split on sentence-ending punctuation, keeping the punctuation with the sentence
    const sentences = normalized.split(/(?<=[.!?])\s+/).map((s)=>s.trim()).filter((s)=>s.length > 0);
    return sentences;
}
function countWords(content) {
    return content.trim().split(/\s+/).filter((word)=>word.length > 0).length;
}
function generateChunks(content, mode) {
    const texts = mode === "paragraph" ? parseIntoParagraphs(content) : parseIntoSentences(content);
    return texts.map((text, index)=>({
            id: generateId(),
            orderIndex: index,
            text
        }));
}
function loadFromStorage() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        // Migrate old data format if needed
        return parsed.map((set)=>{
            if (!set.chunkMode || !set.chunks) {
                const chunkMode = "paragraph";
                return {
                    ...set,
                    updatedAt: set.updatedAt || set.createdAt,
                    chunkMode,
                    chunks: generateChunks(set.content, chunkMode)
                };
            }
            return set;
        });
    } catch  {
        return [];
    }
}
function saveToStorage(sets) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
    } catch  {
    // Silently fail if localStorage is unavailable
    }
}
function MemorizationProvider({ children }) {
    _s();
    const [sets, setSets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoaded, setIsLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MemorizationProvider.useEffect": ()=>{
            setSets(loadFromStorage());
            setIsLoaded(true);
        }
    }["MemorizationProvider.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MemorizationProvider.useEffect": ()=>{
            if (isLoaded) {
                saveToStorage(sets);
            }
        }
    }["MemorizationProvider.useEffect"], [
        sets,
        isLoaded
    ]);
    const addSet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MemorizationProvider.useCallback[addSet]": (title, content)=>{
            const id = generateId();
            const now = new Date().toISOString();
            const chunkMode = "paragraph";
            const newSet = {
                id,
                title,
                content,
                createdAt: now,
                updatedAt: now,
                chunkMode,
                chunks: generateChunks(content, chunkMode)
            };
            setSets({
                "MemorizationProvider.useCallback[addSet]": (prev)=>[
                        newSet,
                        ...prev
                    ]
            }["MemorizationProvider.useCallback[addSet]"]);
            return id;
        }
    }["MemorizationProvider.useCallback[addSet]"], []);
    const getSet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MemorizationProvider.useCallback[getSet]": (id)=>{
            return sets.find({
                "MemorizationProvider.useCallback[getSet]": (set)=>set.id === id
            }["MemorizationProvider.useCallback[getSet]"]);
        }
    }["MemorizationProvider.useCallback[getSet]"], [
        sets
    ]);
    const updateChunkMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MemorizationProvider.useCallback[updateChunkMode]": (id, mode)=>{
            setSets({
                "MemorizationProvider.useCallback[updateChunkMode]": (prev)=>prev.map({
                        "MemorizationProvider.useCallback[updateChunkMode]": (set)=>{
                            if (set.id === id && set.chunkMode !== mode) {
                                return {
                                    ...set,
                                    chunkMode: mode,
                                    chunks: generateChunks(set.content, mode),
                                    updatedAt: new Date().toISOString()
                                };
                            }
                            return set;
                        }
                    }["MemorizationProvider.useCallback[updateChunkMode]"])
            }["MemorizationProvider.useCallback[updateChunkMode]"]);
        }
    }["MemorizationProvider.useCallback[updateChunkMode]"], []);
    const deleteSet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MemorizationProvider.useCallback[deleteSet]": (id)=>{
            setSets({
                "MemorizationProvider.useCallback[deleteSet]": (prev)=>prev.filter({
                        "MemorizationProvider.useCallback[deleteSet]": (set)=>set.id !== id
                    }["MemorizationProvider.useCallback[deleteSet]"])
            }["MemorizationProvider.useCallback[deleteSet]"]);
        }
    }["MemorizationProvider.useCallback[deleteSet]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MemorizationContext.Provider, {
        value: {
            sets,
            isLoaded,
            addSet,
            getSet,
            updateChunkMode,
            deleteSet
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/memorization-context.tsx",
        lineNumber: 198,
        columnNumber: 5
    }, this);
}
_s(MemorizationProvider, "7ti3OxsWWY/1vv1A+oKCjh6dGyk=");
_c = MemorizationProvider;
function useMemorization() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(MemorizationContext);
    if (context === undefined) {
        throw new Error("useMemorization must be used within a MemorizationProvider");
    }
    return context;
}
_s1(useMemorization, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "MemorizationProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=lib_memorization-context_tsx_0vl267.._.js.map