/**
 * Tipos de dominio del usuario (sin acoplar a Mongoose).
 * Úsalos en respuestas API, mapeos o servicios que no necesiten el documento completo.
 */

export interface IUserPhone {
  countryCode: string;
  phoneNumber: string;
}

export interface IUserBase {
  email: string;
  username: string;
  lastname: string;
  phone: IUserPhone;
  country: string;
  city: string;
  photoUrl?: string;
  role: string;
  isActive: boolean;
  firebaseUid?: string;
}

/** Usuario tal como puede exponerse al cliente (sin contraseña). */
export interface IUserPublic extends IUserBase {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}
