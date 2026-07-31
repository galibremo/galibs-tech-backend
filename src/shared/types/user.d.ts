interface CurrentUser {
  id: number;
  name: string;
  publicId: string;
  email: string;
  emailVerified: boolean;
  image: string | null | undefined;
  role: 'CUSTOMER' | 'AGENT' | 'SUPER_ADMIN';
  createdAt: Date;
  updatedAt: Date;
}
