/**
 * Import required classes / libraries / constants
 */
import * as Ajv from 'ajv';
import { AxiosPromise } from 'axios';
import { v4 as uuid } from 'uuid';

import { ErrorMessages } from './constants/errorMessages';
import { Authentication } from '../utils/authentication';
import { Requester } from '../utils/requester';

let ajv: any;

export class Configuration {
  public static accessKeys: PillarSdkConfiguration = {
    privateKey: '',
    updateOAuthFn: undefined,
    oAuthTokens: {accessToken: '', refreshToken: ''},
    apiUrl: '',
    notificationsUrl: '',
    investmentsUrl: '',
  };

  public static accessToken: string = '';
  public static refreshToken: string = '';

  constructor() {
    ajv = new Ajv({
      allErrors: true,
    });
  }

  /**
   * Return an object with accessToken and refreshToken
   */
  getTokens() {
    return {
      accesToken: Configuration.accessToken,
      refreshToken: Configuration.refreshToken,
    }
  }

  /**
   * Set SDK variables for Configuration.
   * @param {PillarSdkConfiguration} incomingConfiguration
   */
  initialise(incomingConfiguration: PillarSdkConfiguration) {
    Configuration.accessKeys = incomingConfiguration;
    if (!Configuration.accessKeys.apiUrl) {
      Configuration.accessKeys.apiUrl = 'http://localhost:8080';
    }
    if (!Configuration.accessKeys.notificationsUrl) {
      Configuration.accessKeys.notificationsUrl = 'http://localhost:8081';
    }
    if (!Configuration.accessKeys.investmentsUrl) {
      Configuration.accessKeys.investmentsUrl = 'http://localhost:8082';
    }
    if (Configuration.accessKeys.oAuthTokens) {
      Configuration.accessToken = Configuration.accessKeys.oAuthTokens.accessToken;
      Configuration.refreshToken = Configuration.accessKeys.oAuthTokens.refreshToken;
    } else {
      if (Configuration.accessKeys.updateOAuthFn) {
        //TODO: get access and refresh token again from the API
      }
    }
  }

  /**
   * Validate data using schema
   * Schema will be compiled and cached
   * @param {Object} schema
   * @param data
   */
  validation(schema: Object, data: any) {
    const valid = ajv.validate(schema, data);
    if (!valid && ajv.errors) {
      throw new TypeError(ajv.errorsText(ajv.errors));
    }
  }

  /**
   * Check Error and returns Signature
   * @param {Object} signParams
   * @param {string} privateKey
   * @returns {string}
   */
  checkSignature(signParams: Object, privateKey: string) {
    const xAPISignature = Authentication.sign(signParams, privateKey);

    if (!xAPISignature) {
      throw new Error(ErrorMessages.SigningError);
    }
    return xAPISignature;
  }

  // TODO: We need to check it with the other endpoints and improve dependently from situation.
  /**
   * Make an Axios request based on default configuration
   * @param {object} options
   * @param {object=} options.data
   * @param {object=} options.params
   * @param {object=} options.sendParams
   * @param {object} options.schema
   * @param {any} options.defaultRequest
   * @param {url} options.url
   * @param {boolean=} options.auth
   */
  executeRequest({
    data,
    params,
    sendParams = true,
    schema,
    defaultRequest,
    url,
    auth = true,
  }: {
    data?: object;
    params?: object;
    sendParams?: boolean;
    schema?: object;
    defaultRequest: any;
    url: string;
    auth?: boolean;
  }): AxiosPromise {
    const payload: any =
      defaultRequest.method.toLowerCase() === 'get' ? params : data;
    if (schema) {
      try {
        this.validation(schema, payload);
      } catch (e) {
        return Promise.reject(e);
      }
    }
    let request;

    request = {
      ...defaultRequest,
      url,
      headers: { ...defaultRequest.headers },
    };

    // check if method needs data to be sent or if it uses data within the url
    if (sendParams) {
      request.data = data;
      request.params = params;
    }

    if (auth) {
      if (Configuration.accessToken) {
        request.headers['Authorization'] = `Bearer ${
          Configuration.accessToken
        }`;
      } else {
        request.headers['X-API-Signature'] = this.checkSignature(
          payload,
          Configuration.accessKeys.privateKey,
        );
      }
    }

    return Requester.execute(request);
  }
}
