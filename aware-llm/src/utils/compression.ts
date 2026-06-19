import { createBrotliCompress, createDeflate, createGzip } from "node:zlib";

/**
 * Compression format type
 */
type CompressionFormat = "gzip" | "deflate" | "br";

/**
 * Creates a compression stream for the specified format
 * @param format - Compression format (gzip, deflate, or br)
 * @returns Object with readable and writable streams
 * @throws Error if format is unsupported
 */
function createCompressionStream(format: CompressionFormat) {
	let handler: ReturnType<
		typeof createGzip | typeof createDeflate | typeof createBrotliCompress
	>;

	switch (format) {
		case "gzip":
			handler = createGzip();
			break;
		case "deflate":
			handler = createDeflate();
			break;
		case "br":
			handler = createBrotliCompress();
			break;
		default:
			throw new Error(`Unsupported compression format: ${format}`);
	}

	const readableStream = new ReadableStream({
		start(controller) {
			handler.on("data", (chunk) => controller.enqueue(chunk));
			handler.on("end", () => controller.close());
			handler.on("error", (err) => controller.error(err));
		},
	});

	const writableStream = new WritableStream({
		write(chunk) {
			handler.write(chunk);
		},
		close() {
			handler.end();
		},
	});

	return { readable: readableStream, writable: writableStream };
}

/**
 * Polyfill for CompressionStream if not available in the runtime
 * Uses Node.js zlib for compression when Web Streams API is not available
 */
export function setupCompressionPolyfill(): void {
	if (typeof globalThis.CompressionStream === "undefined") {
		class CompressionStream {
			readable: ReadableStream<Uint8Array>;
			writable: WritableStream<Uint8Array>;

			constructor(format: string) {
				const compressionFormat = format.toLowerCase() as CompressionFormat;
				const { readable, writable } =
					createCompressionStream(compressionFormat);
				this.readable = readable;
				this.writable = writable;
			}
		}

		globalThis.CompressionStream =
			CompressionStream as typeof globalThis.CompressionStream;
	}
}
