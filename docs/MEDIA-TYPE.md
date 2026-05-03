# λJSON Media Type Registration

This document contains the information required for IANA media type registration.

## Media Type Name

**Type name:** application  
**Subtype name:** vnd.lambda-json

## Registration Information

### Required Parameters

None.

### Optional Parameters

- `version`: The λJSON specification version (e.g., "1.0")
- `charset`: Always UTF-8 (default, can be omitted)

### Encoding Considerations

λJSON documents are UTF-8 encoded JSON. The encoding considerations are identical to those of `application/json` as defined in RFC 8259.

Binary content is not supported directly; binary data should be Base64-encoded if needed.

### Security Considerations

λJSON is a Turing-complete programming language embedded in JSON. Security considerations include:

1. **Resource Exhaustion**: λJSON programs may contain infinite loops or deeply recursive computations. Implementations SHOULD enforce:
   - Maximum execution time limits
   - Maximum recursion depth limits
   - Maximum memory usage limits

2. **Code Execution**: λJSON code can perform computations. However, the language is designed to be pure functional with no side effects:
   - No file system access
   - No network access
   - No access to the host environment
   - No ability to execute arbitrary host code

3. **Denial of Service**: Malicious λJSON documents could attempt to consume excessive resources. Implementations MUST provide mechanisms to limit resource consumption.

4. **Data Exfiltration**: λJSON has no I/O capabilities, so data exfiltration through the language itself is not possible.

5. **Injection Attacks**: Since λJSON is valid JSON, standard JSON parsing protections apply. Implementations should use standard JSON parsers.

**Recommendations for Implementers:**
- Always enforce resource limits when evaluating untrusted λJSON
- Use a fresh global environment for each untrusted evaluation
- Consider running evaluation in a sandboxed environment (separate process, worker, etc.)

### Interoperability Considerations

λJSON documents are valid JSON and can be parsed by any JSON parser. However, to evaluate the computational content, a λJSON interpreter is required.

Different implementations may have varying:
- Numeric precision (JavaScript implementations limited to IEEE 754 double)
- Maximum recursion depths
- Available standard library functions

The conformance test suite (see repository) helps ensure interoperability between implementations.

### Published Specification

The λJSON Language Specification is available at:
- Repository: https://github.com/[username]/lambda-json
- Specification: SPEC.md in the repository

### Applications That Use This Media Type

- Configuration files with embedded business logic
- Data interchange with transformation rules
- Educational tools for functional programming
- Business rule engines
- API responses with processing instructions

### Fragment Identifier Considerations

Fragment identifiers are not defined for this media type.

### Additional Information

**File Extension:** `.ljson`

**Macintosh File Type Code:** Not applicable

**Magic Number(s):** None. λJSON documents start with valid JSON syntax (typically `{` or `[`).

**Deprecated Alias Names:** None

### Contact Information

**Person & email address to contact for further information:**
[Contact information to be added]

### Intended Usage

COMMON

### Restrictions on Usage

None.

### Author/Change Controller

[Author information to be added]

---

## File Extension

The recommended file extension for λJSON documents is:

- `.ljson` - Lambda JSON document

Alternative extensions that may be used:
- `.lambda.json` - More explicit, but longer

## MIME Type Usage Examples

### HTTP Response Header

```http
Content-Type: application/vnd.lambda-json; version=1.0
```

### HTML Script Tag

```html
<script type="application/vnd.lambda-json" src="rules.ljson"></script>
```

### Fetch API

```javascript
const response = await fetch('rules.ljson');
const contentType = response.headers.get('Content-Type');
if (contentType === 'application/vnd.lambda-json') {
  const doc = await response.json();
  const result = evaluate(doc.code, doc.data);
}
```

## Provisional Registration

Until formal IANA registration is complete, implementations may use:

- `application/vnd.lambda-json` (vendor-specific, no registration required)
- `application/x-lambda-json` (experimental, deprecated pattern)

The `vnd.` prefix allows immediate use without formal registration while indicating the vendor-specific nature of the type.
