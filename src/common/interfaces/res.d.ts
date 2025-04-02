export interface IResponseBase {
  status: 'success' | 'error';
  message: string;
  data: any;
}
