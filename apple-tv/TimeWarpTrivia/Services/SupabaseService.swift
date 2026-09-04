import Foundation
import Supabase

// Shared Supabase client, configured once. Decoder/encoder do the
// snake_case<->camelCase conversion so every Model's properties can stay
// plain camelCase with no manual CodingKeys — see Models/*.swift.
enum SupabaseService {
    // Exposed separately (not read back off the client) because
    // PostgrestRequestBuilder.configuration isn't public — RoomRealtimeManager
    // and AnswersRealtimeManager need this same decoder to turn a Postgres
    // Changes payload's raw JSONObject into a Model themselves.
    static let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .custom(decodeSupabaseTimestamp)
        return decoder
    }()

    static let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }()

    static let client = SupabaseClient(
        supabaseURL: Config.supabaseURL,
        supabaseKey: Config.supabaseAnonKey,
        options: SupabaseClientOptions(
            db: .init(encoder: encoder, decoder: decoder)
        )
    )
}

// PostgREST returns `timestamptz` columns as ISO8601 with a variable
// number of fractional-second digits (Postgres's own microsecond
// precision, e.g. ".123456"), which stock ISO8601DateFormatter only
// handles up to milliseconds (3 digits) even with .withFractionalSeconds.
// Trim to milliseconds before handing off to the formatter rather than
// trusting it to cope with 6-digit fractions.
private func decodeSupabaseTimestamp(_ decoder: Decoder) throws -> Date {
    let container = try decoder.singleValueContainer()
    let raw = try container.decode(String.self)

    let withFractional = ISO8601DateFormatter()
    withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let date = withFractional.date(from: normalizedFractionalSeconds(raw)) {
        return date
    }

    let plain = ISO8601DateFormatter()
    plain.formatOptions = [.withInternetDateTime]
    if let date = plain.date(from: raw) {
        return date
    }

    throw DecodingError.dataCorruptedError(
        in: container,
        debugDescription: "Unrecognized timestamp format: \(raw)"
    )
}

// "2024-01-15T10:30:00.123456+00:00" -> "2024-01-15T10:30:00.123+00:00"
// (truncate to milliseconds; a no-op if there are already <=3 digits).
private func normalizedFractionalSeconds(_ raw: String) -> String {
    guard let dotIndex = raw.firstIndex(of: ".") else { return raw }
    let afterDot = raw.index(after: dotIndex)
    guard let fractionEnd = raw[afterDot...].firstIndex(where: { !$0.isNumber }) else { return raw }
    let fraction = raw[afterDot..<fractionEnd]
    guard fraction.count > 3 else { return raw }
    let truncated = fraction.prefix(3)
    return String(raw[..<afterDot] + truncated + raw[fractionEnd...])
}
