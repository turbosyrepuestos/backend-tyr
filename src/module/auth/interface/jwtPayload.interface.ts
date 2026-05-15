export interface JwtPayload {
  sub: string;
  username: string;
  role: string; // Nombre del rol; los permisos se resuelven en el guard desde BD
  jti?: string; // JWT ID para identificar tokens únicos
}
