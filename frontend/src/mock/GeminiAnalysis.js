// Mock Gemini Analysis Data
// This structure matches the backend analysis.js output
const mockGeminiAnalysis = {
  domain: "leetcode.com",
  analysis: `AI Summary (Short):
- The domain leetcode.com has one identified subdomain.
- DNS records show configurations for mail delivery and verification.
- Standard web ports 80 and 443 are open, along with port 8080.
- The website uses Cloudflare for its services and has a valid SSL certificate.

Detailed Analysis:

1.  **Subdomains:**
    The scan identified "leetcode.com" as a subdomain. This means the main domain itself was analyzed.

2.  **DNS Records:**
    *   **A records:** These records point to an IPv4 address (104.20.41.79), which is how the domain name is translated into a numerical address for network communication.
    *   **AAAA records:** These records point to IPv6 addresses, providing an alternative, longer numerical address for network communication.
    *   **MX records:** These indicate mail servers that handle email for the domain, with all listed as belonging to Google's mail services (aspmx.l.google.com and its alternatives). This suggests email for leetcode.com is managed by Google.
    *   **NS records:** These specify the name servers responsible for managing the domain's DNS information. Here, they are identified as belonging to Cloudflare (melinda.ns.cloudflare.com and rob.ns.cloudflare.com).
    *   **TXT records:** These are used for various purposes, including domain verification (to prove ownership of the domain) and sender policy framework (SPF) records. The SPF record indicates that emails may be sent from Amazon SES, Google, Zendesk, and SendGrid.

3.  **Open Ports:**
    The scan indicates that ports 80 (HTTP), 443 (HTTPS), and 8080 are accessible on the server.
    *   Port 80 is commonly used for standard, unencrypted web traffic.
    *   Port 443 is used for secure, encrypted web traffic (HTTPS).
    *   Port 8080 is often used as an alternative or secondary port for web servers.

4.  **HTTP Behavior:**
    When accessing "leetcode.com" via HTTP, the server returned a status code of 403, labeled "Just a moment...". This status code typically means access is forbidden. The server is identified as "cloudflare," and the connection was "redirected." This behavior is often associated with security measures or content delivery networks like Cloudflare.

5.  **SSL/Security:**
    The SSL certificate for "leetcode.com" is marked as "valid" and will expire on March 16, 2026. A valid SSL certificate is essential for secure, encrypted communication over the internet.

6.  **Technology Stack:**
    The scan identified "Cloudflare" as a key technology. Cloudflare is a service that provides content delivery network (CDN), security, and domain name server services.

Overall Risk Assessment:
Low
The scan reveals standard configurations for a publicly accessible website. The use of Cloudflare and a valid SSL certificate are common security practices. The observed HTTP behavior, while indicating access restrictions, is a typical function of services like Cloudflare.`
};

export default mockGeminiAnalysis;

