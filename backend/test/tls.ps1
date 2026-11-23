# Ephemeral loopback test certificate only. Does not install into Windows certificate stores.
$tlsDirectory=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.cache/h-tls'))
$cacheDirectory=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.cache'))
if(-not $tlsDirectory.StartsWith($cacheDirectory+[IO.Path]::DirectorySeparatorChar)){throw 'Invalid TLS fixture path'}
New-Item -ItemType Directory -Path $tlsDirectory -Force | Out-Null
$tlsRsa=[Security.Cryptography.RSA]::Create(2048)
try {
 $tlsRequest=[Security.Cryptography.X509Certificates.CertificateRequest]::new('CN=localhost',$tlsRsa,[Security.Cryptography.HashAlgorithmName]::SHA256,[Security.Cryptography.RSASignaturePadding]::Pkcs1)
 $tlsSan=[Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
 $tlsSan.AddDnsName('localhost');$tlsSan.AddIpAddress([Net.IPAddress]::Parse('127.0.0.1'))
 $tlsRequest.CertificateExtensions.Add($tlsSan.Build())
 $tlsCertificate=$tlsRequest.CreateSelfSigned([DateTimeOffset]::UtcNow.AddMinutes(-1),[DateTimeOffset]::UtcNow.AddDays(1))
 try {
  [IO.File]::WriteAllText((Join-Path $tlsDirectory 'certificate.pem'),$tlsCertificate.ExportCertificatePem())
  [IO.File]::WriteAllText((Join-Path $tlsDirectory 'private.key'),$tlsRsa.ExportPkcs8PrivateKeyPem())
 } finally {$tlsCertificate.Dispose()}
} finally {$tlsRsa.Dispose()}
Write-Output 'Created ephemeral HTTPS loopback fixture in ignored cache.'
