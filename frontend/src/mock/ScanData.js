const scanData = {
  domain: "zoho.com",
  status: "completed",

  subdomains: [
    "www.zoho.com",
    "accounts.zoho.com",
    "mail.zoho.com",
    "api.zoho.com"
  ],

  dns: {
    A: [
      { value: "136.143.188.44", ttl: 300 },
      { value: "136.143.188.45", ttl: 300 }
    ],
    MX: [
      { value: "mx.zoho.com", priority: 10 },
      { value: "mx2.zoho.com", priority: 20 }
    ],
    NS: [
      { value: "ns1.zohocorp.com" },
      { value: "ns2.zohocorp.com" }
    ],
    TXT: [
      { value: "v=spf1 include:zoho.com ~all" }
    ]
  },

  ports: {
    80: true,
    443: true,
    8080: false
  },

  http: {
    "zoho.com": {
      status: 301,
      title: "Zoho | Cloud Software Suite",
      headers: {
        server: "ZGS"
      }
    }
  },

  ssl: {
    "zoho.com": {
      valid: true,
      expiresAt: "2026-09-18"
    }
  },

  tech: ["Nginx", "Java", "React"]
};

export default scanData;

