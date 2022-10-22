var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
import "dotenv/config";
import "reflect-metadata";
import HyperExpress4 from "hyper-express";
import { Server } from "socket.io";

// src/infrastructure/firestore.ts
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
function connectToFirestore() {
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GCP_PROJECT_ID
  });
  return getFirestore(app);
}
__name(connectToFirestore, "connectToFirestore");

// src/auth/handler.ts
import HyperExpress from "hyper-express";
import { autoInjectable as autoInjectable6 } from "tsyringe";

// src/auth/middleware.ts
import paseto2 from "paseto";
import { autoInjectable as autoInjectable5 } from "tsyringe";

// src/auth/service.ts
import argon2 from "@node-rs/argon2";
import { cpus } from "os";
import paseto from "paseto";

// config/token.ts
var token_default = {
  accessToken: {
    expiration: process.env.ACCESS_TOKEN_EXPIRATION || "15 minutes",
    secretKey: process.env.ACCESS_TOKEN_SECRET_KEY,
    publicKey: process.env.ACCESS_TOKEN_PUBLIC_KEY
  },
  refreshToken: {
    expiration: process.env.REFRESH_TOKEN_EXPIRATION || "100 days",
    secretKey: process.env.REFRESH_TOKEN_SECRET_KEY,
    publicKey: process.env.REFRESH_TOKEN_PUBLIC_KEY
  }
};

// src/user/service.ts
import { CollectionReference } from "firebase-admin/firestore";
import { autoInjectable, inject, singleton } from "tsyringe";
var __decorate = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var __param = function(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
};
var UserService = /* @__PURE__ */ __name(class UserService2 {
  constructor(collection) {
    this.collection = collection;
    this.getUserByUsername = async (username) => {
      if (!username)
        return null;
      const userRes = await this.collection.where("username", "==", username).limit(1).get();
      if (userRes.empty)
        return null;
      const userDoc = userRes.docs[0];
      const user = userDoc == null ? void 0 : userDoc.data();
      if (user && (userDoc == null ? void 0 : userDoc.id)) {
        user.id = userDoc.id;
      }
      return user;
    };
    this.getUserById = async (id) => {
      if (!id)
        return null;
      const userDoc = await this.collection.doc(id).get();
      const user = userDoc.data();
      if (user && userDoc.id) {
        user.id = userDoc.id;
      }
      return user;
    };
  }
}, "UserService");
UserService = __decorate([
  singleton(),
  autoInjectable(),
  __param(0, inject("UsersCollection")),
  __metadata("design:type", Function),
  __metadata("design:paramtypes", [
    typeof CollectionReference === "undefined" ? Object : CollectionReference
  ])
], UserService);

// src/auth/service.ts
import { autoInjectable as autoInjectable4, singleton as singleton3 } from "tsyringe";

// src/infrastructure/casbin/adapter.ts
import _ from "lodash";
import { Helper } from "casbin";
import { CollectionReference as CollectionReference2, Firestore } from "firebase-admin/firestore";
import { autoInjectable as autoInjectable2, inject as inject2 } from "tsyringe";
var __decorate2 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata2 = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var __param2 = function(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
};
var CasbinAdapter = /* @__PURE__ */ __name(class CasbinAdapter2 {
  constructor(firestore, policiesCollection) {
    this.firestore = firestore;
    this.policiesCollection = policiesCollection;
    this.maxWritesPerBatch = 500;
    this.loadPolicy = async (model) => {
      const policiesRes = await this.policiesCollection.get();
      if (policiesRes.empty)
        return;
      _.each(policiesRes.docs, (policyDoc) => {
        const policy = policyDoc.data();
        policy.id = policyDoc.id;
        loadPolicyLine(policy, model);
      });
    };
    this.savePolicy = async (model) => {
      try {
        const batch = this.firestore.batch();
        const policiesRes = await this.policiesCollection.get();
        _.each(policiesRes.docs, (policyDoc) => {
          batch.delete(policyDoc.ref);
        });
        const pPolicies = createPoliciesFromAstMap(model.model.get("p"));
        const gPolicies = createPoliciesFromAstMap(model.model.get("g"));
        const combinedPolicies = [
          ...pPolicies,
          ...gPolicies
        ];
        if (combinedPolicies.length > 0) {
          _.each(combinedPolicies, (policy) => {
            const policyDocRef = this.policiesCollection.doc();
            batch.set(policyDocRef, policy);
          });
        }
        await batch.commit();
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    };
    this.addPolicy = async (_sec, ptype, rule) => {
      const policy = createPolicy(ptype, rule);
      await this.policiesCollection.add(policy);
    };
    this.addPolicies = async (_sec, ptype, rules) => {
      const policies = rules.map((rule) => createPolicy(ptype, rule));
      const insertChunks = _.chunk(policies, this.maxWritesPerBatch);
      const insertPromises = _.map(insertChunks, (chunk) => {
        const batch = this.firestore.batch();
        _.each(chunk, (policy) => {
          const policyDocRef = this.policiesCollection.doc();
          batch.set(policyDocRef, policy);
        });
        return batch.commit();
      });
      await Promise.all(insertPromises);
    };
    this.batchRemovePolicies = async (batch, policies) => {
      const deletePromises = _.map(policies, async (policy) => {
        const policiesRes = await this.policiesCollection.where("ptype", "==", policy.ptype).where("v0", "==", policy.v0).where("v1", "==", policy.v1).where("v2", "==", policy.v2).where("v3", "==", policy.v3).where("v4", "==", policy.v4).where("v5", "==", policy.v5).limit(1).get();
        if (policiesRes.empty)
          return;
        _.each(policiesRes.docs, (policyDoc) => {
          batch.delete(policyDoc.ref);
        });
      });
      await Promise.all(deletePromises);
    };
    this.removePolicy = async (sec, ptype, rule) => {
      await this.removePolicies(sec, ptype, [
        rule
      ]);
    };
    this.removePolicies = async (_sec, ptype, rules) => {
      const deleteChunks = _.chunk(rules, this.maxWritesPerBatch);
      const deletePromises = _.map(deleteChunks, async (chunk) => {
        const batch = this.firestore.batch();
        const policies = chunk.map((rule) => createPolicy(ptype, rule));
        await this.batchRemovePolicies(batch, policies);
        await batch.commit();
      });
      await Promise.all(deletePromises);
    };
    this.removeFilteredPolicy = async (_sec, ptype, fieldIndex, ...fieldValues) => {
      const filteredPolicy = createFilteredPolicy(ptype, fieldIndex, ...fieldValues);
      const batch = this.firestore.batch();
      await this.batchRemovePolicies(batch, [
        filteredPolicy
      ]);
      await batch.commit();
    };
  }
}, "CasbinAdapter");
CasbinAdapter = __decorate2([
  autoInjectable2(),
  __param2(0, inject2("Firestore")),
  __param2(1, inject2("PoliciesCollection")),
  __metadata2("design:type", Function),
  __metadata2("design:paramtypes", [
    typeof Firestore === "undefined" ? Object : Firestore,
    typeof CollectionReference2 === "undefined" ? Object : CollectionReference2
  ])
], CasbinAdapter);
function loadPolicyLine(policy, model) {
  const ps = [
    policy.v0,
    policy.v1,
    policy.v2,
    policy.v3,
    policy.v4,
    policy.v5
  ];
  const policyLine = policy.ptype + ", " + _.compact(ps).join(", ");
  Helper.loadPolicyLine(policyLine, model);
}
__name(loadPolicyLine, "loadPolicyLine");
function createPolicy(ptype, rule) {
  if (rule.length === 3) {
    return {
      ptype,
      v0: rule[0],
      v1: rule[1],
      v2: rule[2]
    };
  }
  return _.reduce(rule, (acc, _value, index) => {
    acc[`v${index}`] = rule[index];
    return acc;
  }, {
    ptype
  });
}
__name(createPolicy, "createPolicy");
function createPoliciesFromAstMap(astMap) {
  const policies = [];
  if (!astMap)
    return policies;
  astMap.forEach((ast, ptype) => {
    _.each(ast.policy, (rule) => {
      policies.push(createPolicy(ptype, rule));
    });
  });
  return policies;
}
__name(createPoliciesFromAstMap, "createPoliciesFromAstMap");
function createFilteredPolicy(ptype, fieldIndex, ...fieldValues) {
  const filteredPolicy = {
    ptype
  };
  if (fieldIndex <= 0 && 0 < fieldIndex + fieldValues.length) {
    filteredPolicy.v0 = fieldValues[0 - fieldIndex];
  }
  if (fieldIndex <= 1 && 1 < fieldIndex + fieldValues.length) {
    filteredPolicy.v1 = fieldValues[1 - fieldIndex];
  }
  if (fieldIndex <= 2 && 2 < fieldIndex + fieldValues.length) {
    filteredPolicy.v2 = fieldValues[2 - fieldIndex];
  }
  if (fieldIndex <= 3 && 3 < fieldIndex + fieldValues.length) {
    filteredPolicy.v3 = fieldValues[3 - fieldIndex];
  }
  if (fieldIndex <= 4 && 4 < fieldIndex + fieldValues.length) {
    filteredPolicy.v4 = fieldValues[4 - fieldIndex];
  }
  if (fieldIndex <= 5 && 5 < fieldIndex + fieldValues.length) {
    filteredPolicy.v5 = fieldValues[5 - fieldIndex];
  }
  return filteredPolicy;
}
__name(createFilteredPolicy, "createFilteredPolicy");

// src/infrastructure/casbin/enforcer.ts
import { newEnforcer } from "casbin";
import { autoInjectable as autoInjectable3, singleton as singleton2 } from "tsyringe";
var __decorate3 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata3 = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var CasbinEnforcer = /* @__PURE__ */ __name(class CasbinEnforcer2 {
  constructor(adapter) {
    this.adapter = adapter;
    this.instance = null;
  }
  async getEnforcer() {
    if (!this.instance) {
      this.instance = await newEnforcer("config/casbin/model.conf", this.adapter);
      this.instance.loadPolicy();
    }
    return this.instance;
  }
}, "CasbinEnforcer");
CasbinEnforcer = __decorate3([
  singleton2(),
  autoInjectable3(),
  __metadata3("design:type", Function),
  __metadata3("design:paramtypes", [
    typeof CasbinAdapter === "undefined" ? Object : CasbinAdapter
  ])
], CasbinEnforcer);

// src/auth/service.ts
var __decorate4 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata4 = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var CORES = cpus().length;
var AuthService = /* @__PURE__ */ __name(class AuthService2 {
  constructor(casbinEnforcer, userService) {
    this.casbinEnforcer = casbinEnforcer;
    this.userService = userService;
    this.generateToken = async ({ user, secretKey, expiration }) => {
      const payload = {
        id: user.id
      };
      const token = await paseto.V4.sign(payload, secretKey, {
        expiresIn: expiration
      });
      return token;
    };
    this.generateAccessToken = async (user) => {
      if (!token_default.accessToken.secretKey) {
        throw new Error("Private key for access token is not set");
      }
      return this.generateToken({
        user,
        secretKey: token_default.accessToken.secretKey,
        expiration: token_default.accessToken.expiration
      });
    };
    this.generateRefreshToken = async (user) => {
      if (!token_default.refreshToken.secretKey) {
        throw new Error("Private key for refresh token is not set");
      }
      return this.generateToken({
        user,
        secretKey: token_default.refreshToken.secretKey,
        expiration: token_default.refreshToken.expiration
      });
    };
    this.verifyPassword = async (password, hash) => {
      const isPasswordValid = await argon2.verify(hash, password, {
        parallelism: CORES
      });
      return isPasswordValid;
    };
    this.verifyToken = async (token, publicKey) => {
      const { payload } = await paseto.V4.verify(token, publicKey, {
        complete: true
      });
      return payload;
    };
    this.verifyAccessToken = async (token) => {
      if (!token_default.accessToken.publicKey) {
        throw new Error("Public key for access token is not set");
      }
      return this.verifyToken(token, token_default.accessToken.publicKey);
    };
    this.verifyRefreshToken = async (token) => {
      if (!token_default.refreshToken.publicKey) {
        throw new Error("Public key for refresh token is not set");
      }
      return this.verifyToken(token, token_default.refreshToken.publicKey);
    };
    this.refreshToken = async (refreshToken) => {
      const tokenPayload = await this.verifyRefreshToken(refreshToken);
      const user = await this.userService.getUserById(tokenPayload == null ? void 0 : tokenPayload.id);
      if (!user) {
        throw new Error("User not found");
      }
      const [accessToken, newRefreshToken, roles] = await Promise.all([
        this.generateAccessToken(user),
        this.generateRefreshToken(user),
        this.getRolesByUser(user)
      ]);
      return {
        id: user.id,
        username: user.username,
        accessToken,
        refreshToken: newRefreshToken,
        roles
      };
    };
    this.getRolesByUser = async (user) => {
      const enforcer = await this.casbinEnforcer.getEnforcer();
      const roles = await enforcer.getRolesForUser(user.id);
      return roles;
    };
    this.signIn = async (username, password) => {
      const user = await this.userService.getUserByUsername(username);
      if (!user) {
        const e = new Error("Invalid username or password");
        e.httpStatusCode = 401;
        throw e;
      }
      if (!(user == null ? void 0 : user.password)) {
        throw new Error("User password not found, please contact admin to reset your password");
      }
      const isPasswordValid = await this.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        const e1 = new Error("Invalid username or password");
        e1.httpStatusCode = 401;
        throw e1;
      }
      const [accessToken, refreshToken, roles] = await Promise.all([
        this.generateAccessToken(user),
        this.generateRefreshToken(user),
        this.getRolesByUser(user)
      ]);
      return {
        id: user.id,
        username,
        accessToken,
        refreshToken,
        roles
      };
    };
  }
}, "AuthService");
AuthService = __decorate4([
  singleton3(),
  autoInjectable4(),
  __metadata4("design:type", Function),
  __metadata4("design:paramtypes", [
    typeof CasbinEnforcer === "undefined" ? Object : CasbinEnforcer,
    typeof UserService === "undefined" ? Object : UserService
  ])
], AuthService);

// src/auth/middleware.ts
var __decorate5 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata5 = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var AuthMiddleware = /* @__PURE__ */ __name(class AuthMiddleware2 {
  constructor(authService) {
    this.authService = authService;
    this.verifyAccessToken = async (req, res) => {
      var _a;
      const token = (_a = req.headers.authorization) == null ? void 0 : _a.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({
          message: "No token provided!"
        });
        return;
      }
      try {
        const tokenPayload = await this.authService.verifyAccessToken(token);
        if (!tokenPayload) {
          throw new Error("Invalid token");
        }
        return;
      } catch (error) {
        if (!(error instanceof paseto2.errors.PasetoError)) {
          console.error({
            error
          });
        }
        let message = error.message || "Unauthorized!";
        res.status(401).json({
          message
        });
        return;
      }
    };
  }
}, "AuthMiddleware");
AuthMiddleware = __decorate5([
  autoInjectable5(),
  __metadata5("design:type", Function),
  __metadata5("design:paramtypes", [
    typeof AuthService === "undefined" ? Object : AuthService
  ])
], AuthMiddleware);

// src/auth/schema.ts
import Joi from "joi";
var signInRequestSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
}).options({
  allowUnknown: true
});
var refreshTokenRequestSchema = Joi.object({
  refreshToken: Joi.string().required()
}).options({
  allowUnknown: true
});

// src/auth/handler.ts
import paseto3 from "paseto";
var __decorate6 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata6 = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var AuthHandler = /* @__PURE__ */ __name(class AuthHandler2 {
  constructor(authService, middleware) {
    this.authService = authService;
    this.middleware = middleware;
    this.routes = () => {
      const r = new HyperExpress.Router();
      r.post("/auth/signin", this.signIn);
      r.post("/auth/refresh-token", this.refreshToken);
      return r;
    };
    this.signIn = async (req, res) => {
      const requestBody = await req.json();
      const { error } = signInRequestSchema.validate(requestBody);
      if (error) {
        res.status(400).json({
          status: false,
          data: null,
          error: error.message
        });
        return;
      }
      try {
        const credential = await this.authService.signIn(requestBody.username, requestBody.password);
        res.json({
          status: true,
          data: credential,
          error: null
        });
      } catch (error1) {
        if (!error1.httpStatusCode)
          console.error(error1);
        res.status(error1.httpStatusCode || 500).json({
          status: false,
          data: null,
          error: error1.message
        });
      }
    };
    this.refreshToken = async (req, res) => {
      const requestBody = await req.json();
      const { error } = refreshTokenRequestSchema.validate(requestBody);
      if (error) {
        res.status(400).json({
          status: false,
          data: null,
          error: error.message
        });
        return;
      }
      try {
        const credential = await this.authService.refreshToken(requestBody.refreshToken);
        res.json({
          status: true,
          data: credential,
          error: null
        });
      } catch (error1) {
        console.error(error1);
        if (error1 instanceof paseto3.errors.PasetoClaimInvalid) {
          error1["httpStatusCode"] = 401;
        }
        res.status(error1.httpStatusCode || 500).json({
          status: false,
          data: null,
          error: error1.message
        });
      }
    };
  }
}, "AuthHandler");
AuthHandler = __decorate6([
  autoInjectable6(),
  __metadata6("design:type", Function),
  __metadata6("design:paramtypes", [
    typeof AuthService === "undefined" ? Object : AuthService,
    typeof AuthMiddleware === "undefined" ? Object : AuthMiddleware
  ])
], AuthHandler);

// src/patient/service.ts
import _2 from "lodash";
import { CollectionReference as CollectionReference3, FieldValue } from "firebase-admin/firestore";
import { autoInjectable as autoInjectable7, inject as inject3, singleton as singleton4 } from "tsyringe";
import parsePhoneNumber from "libphonenumber-js";

// src/common/utils/nanoidNumberOnly.ts
import { customAlphabet } from "nanoid";
var nanoidNumberOnly = customAlphabet("1234567890", 10);

// src/patient/service.ts
var __decorate7 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata7 = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var __param3 = function(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
};
var PatientService = /* @__PURE__ */ __name(class PatientService2 {
  constructor(patientsCollection) {
    this.patientsCollection = patientsCollection;
    this.generatePatientNumber = async () => {
      let patientNumberToReturn = nanoidNumberOnly(24);
      for (let i = 0; i < 5; i++) {
        const patientNumber = nanoidNumberOnly(8 + i);
        const docs = await this.patientsCollection.select("patientNumber").where("patientNumber", "==", patientNumber).get();
        if (docs.empty) {
          patientNumberToReturn = patientNumber;
          break;
        }
      }
      return "P" + patientNumberToReturn;
    };
    this.getPatient = async (id) => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const doc = await this.patientsCollection.doc(id).get();
      if (!doc.exists)
        return null;
      const data = doc.data();
      const patient = {
        ...data,
        id: doc.id,
        dateOfBirth: (_b = (_a = data == null ? void 0 : data.dateOfBirth) == null ? void 0 : _a.toDate) == null ? void 0 : _b.call(_a),
        lastActive: (_d = (_c = data == null ? void 0 : data.lastActive) == null ? void 0 : _c.toDate) == null ? void 0 : _d.call(_c),
        createdAt: (_f = (_e = data == null ? void 0 : data.createdAt) == null ? void 0 : _e.toDate) == null ? void 0 : _f.call(_e),
        updatedAt: (_h = (_g = data == null ? void 0 : data.updatedAt) == null ? void 0 : _g.toDate) == null ? void 0 : _h.call(_g)
      };
      return patient;
    };
    this.getPatients = async () => {
      const result = await this.patientsCollection.select("name", "dateOfBirth", "address").orderBy("name", "asc").get();
      const patients = _2.map(result.docs, (doc) => {
        var _a, _b;
        const docData = doc.data();
        const patient = {
          ...docData,
          id: doc.id,
          dateOfBirth: (_b = (_a = docData == null ? void 0 : docData.dateOfBirth) == null ? void 0 : _a.toDate) == null ? void 0 : _b.call(_a)
        };
        return patient;
      });
      return patients;
    };
    this.addPatient = async (patient) => {
      var _a;
      const parsedPhoneNumber = parsePhoneNumber(patient.phone, "ID");
      if ((_a = parsedPhoneNumber == null ? void 0 : parsedPhoneNumber.isValid) == null ? void 0 : _a.call(parsedPhoneNumber)) {
        patient.phone = parsedPhoneNumber.number;
      }
      const payload = {
        ...patient,
        patientNumber: await this.generatePatientNumber(),
        lastActive: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      delete payload.id;
      const docRef = await this.patientsCollection.add(payload);
      return docRef.id;
    };
    this.updatePatient = async (patient) => {
      var _a;
      const parsedPhoneNumber = parsePhoneNumber(patient.phone, "ID");
      if ((_a = parsedPhoneNumber == null ? void 0 : parsedPhoneNumber.isValid) == null ? void 0 : _a.call(parsedPhoneNumber)) {
        patient.phone = parsedPhoneNumber.number;
      }
      const payload = {
        ...patient,
        updatedAt: FieldValue.serverTimestamp()
      };
      delete payload.id;
      const doc = await this.patientsCollection.doc(patient.id).update(payload);
      patient.updatedAt = doc.writeTime.toDate();
      return patient;
    };
    this.removePatient = async (id) => {
      await this.patientsCollection.doc(id).delete();
    };
  }
}, "PatientService");
PatientService = __decorate7([
  singleton4(),
  autoInjectable7(),
  __param3(0, inject3("PatientsCollection")),
  __metadata7("design:type", Function),
  __metadata7("design:paramtypes", [
    typeof CollectionReference3 === "undefined" ? Object : CollectionReference3
  ])
], PatientService);

// src/patient/handler.ts
import HyperExpress2 from "hyper-express";
import { autoInjectable as autoInjectable8 } from "tsyringe";

// src/patient/schema.ts
import Joi2 from "joi";
var addPatientRequestSchema = Joi2.object({
  name: Joi2.string().min(2).required(),
  gender: Joi2.number().valid(1, 2).required(),
  dateOfBirth: Joi2.date().iso().required(),
  address: Joi2.string().min(4).required(),
  phone: Joi2.string().allow(null, ""),
  bodyHeight: Joi2.number().required(),
  bodyWeight: Joi2.number().required()
}).options({
  allowUnknown: true
});
var updatePatientRequestSchema = Joi2.object({
  name: Joi2.string().min(2),
  gender: Joi2.number().valid(1, 2),
  dateOfBirth: Joi2.date().iso(),
  address: Joi2.string().min(4),
  phone: Joi2.string().allow(null, ""),
  bodyHeight: Joi2.number(),
  bodyWeight: Joi2.number()
}).options({
  allowUnknown: true
});

// src/patient/handler.ts
var __decorate8 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata8 = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var PatientHandler = /* @__PURE__ */ __name(class PatientHandler2 {
  constructor(patientService) {
    this.patientService = patientService;
    this.routes = (middlewares = []) => {
      const r = new HyperExpress2.Router();
      r.use("/patients", ...middlewares);
      r.get("/patients", this.getPatients);
      r.get("/patients/:id", this.getPatient);
      r.post("/patients", this.addPatient);
      r.patch("/patients/:id", this.updatePatient);
      r.delete("/patients/:id", this.removePatient);
      return r;
    };
    this.addPatient = async (req, res) => {
      const requestBody = await req.json();
      const { error } = addPatientRequestSchema.validate(requestBody);
      if (error) {
        res.status(400).json({
          status: false,
          data: null,
          error: error.message
        });
        return;
      }
      const patient = {
        id: "",
        patientNumber: "",
        name: requestBody.name,
        gender: requestBody.gender,
        dateOfBirth: new Date(requestBody.dateOfBirth),
        address: requestBody.address,
        phone: requestBody.phone || "",
        bodyHeight: requestBody.bodyHeight,
        bodyWeight: requestBody.bodyWeight,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      try {
        const result = await this.patientService.addPatient(patient);
        res.status(201).json({
          status: true,
          data: result,
          error: null
        });
      } catch (error1) {
        console.error(error1);
        res.status(error1.httpStatusCode || 500).json({
          status: false,
          data: null,
          error: error1.message
        });
      }
    };
    this.getPatients = async (_req, res) => {
      try {
        const patients = await this.patientService.getPatients();
        res.json({
          status: true,
          data: patients,
          error: null
        });
      } catch (error) {
        console.error(error);
        res.status(error.httpStatusCode || 500).json({
          status: false,
          data: [],
          error: error.message
        });
      }
    };
    this.getPatient = async (req, res) => {
      try {
        const patient = await this.patientService.getPatient(req.path_parameters.id);
        if (!patient) {
          res.status(404).json({
            status: false,
            data: null,
            error: "Patient not found"
          });
          return;
        }
        patient == null ? true : delete patient.updatedAt;
        patient == null ? true : delete patient.createdAt;
        res.json({
          status: true,
          data: patient,
          error: null
        });
      } catch (error) {
        console.error(error);
        res.status(error.httpStatusCode || 500).json({
          status: false,
          data: null,
          error: error.message
        });
      }
    };
    this.updatePatient = async (req, res) => {
      const requestBody = await req.json();
      const { error } = updatePatientRequestSchema.validate(requestBody);
      if (error) {
        res.status(400).json({
          status: false,
          data: null,
          error: error.message
        });
        return;
      }
      try {
        const patient = await this.patientService.getPatient(req.path_parameters.id);
        if (!patient) {
          res.status(404).json({
            status: false,
            data: null,
            error: "Patient not found"
          });
          return;
        }
        patient.name = requestBody.name || patient.name;
        patient.gender = requestBody.gender || patient.gender;
        patient.dateOfBirth = new Date(requestBody.dateOfBirth || patient.dateOfBirth);
        patient.address = requestBody.address || patient.address;
        patient.phone = requestBody.phone ?? patient.phone;
        patient.bodyHeight = requestBody.bodyHeight || patient.bodyHeight;
        patient.bodyWeight = requestBody.bodyWeight || patient.bodyWeight;
        patient.updatedAt = new Date();
        const result = await this.patientService.updatePatient(patient);
        res.json({
          status: true,
          data: result,
          error: null
        });
      } catch (error1) {
        console.error(error1);
        res.status(error1.httpStatusCode || 500).json({
          status: false,
          data: null,
          error: error1.message
        });
      }
    };
    this.removePatient = async (req, res) => {
      try {
        const patient = await this.patientService.getPatient(req.path_parameters.id);
        if (!patient) {
          res.status(404).json({
            status: false,
            data: null,
            error: "Patient not found"
          });
          return;
        }
        await this.patientService.removePatient(patient.id);
        res.json({
          status: true,
          data: "Patient removed successfully",
          error: null
        });
      } catch (error) {
        console.error(error);
        res.status(error.httpStatusCode || 500).json({
          status: false,
          data: null,
          error: error.message
        });
      }
    };
  }
}, "PatientHandler");
PatientHandler = __decorate8([
  autoInjectable8(),
  __metadata8("design:type", Function),
  __metadata8("design:paramtypes", [
    typeof PatientService === "undefined" ? Object : PatientService
  ])
], PatientHandler);

// src/queue/service.ts
import _3 from "lodash";
import { CollectionReference as CollectionReference4, FieldValue as FieldValue2 } from "firebase-admin/firestore";
import { autoInjectable as autoInjectable9, inject as inject4, singleton as singleton5 } from "tsyringe";
var __decorate9 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata9 = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var __param4 = function(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
};
var QueueService = /* @__PURE__ */ __name(class QueueService2 {
  constructor(queueCollection, queueTypeCollection) {
    this.queueCollection = queueCollection;
    this.queueTypeCollection = queueTypeCollection;
    this.addQueue = async (queue) => {
      const payload = {
        ...queue,
        createdAt: FieldValue2.serverTimestamp(),
        updatedAt: FieldValue2.serverTimestamp()
      };
      delete payload.id;
      const docRef = await this.queueCollection.add(payload);
      return docRef.id;
    };
    this.getQueues = async () => {
      const result = await this.queueCollection.orderBy("updatedAt", "desc").get();
      const queuesPromises = _3.map(result.docs, async (doc) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const data = doc.data();
        const queue = {
          ...data,
          id: doc.id,
          patient: {
            ...data == null ? void 0 : data.patient,
            dateOfBirth: (_c = (_b = (_a = data == null ? void 0 : data.patient) == null ? void 0 : _a.dateOfBirth) == null ? void 0 : _b.toDate) == null ? void 0 : _c.call(_b)
          },
          createdAt: (_e = (_d = data == null ? void 0 : data.createdAt) == null ? void 0 : _d.toDate) == null ? void 0 : _e.call(_d),
          updatedAt: (_g = (_f = data == null ? void 0 : data.updatedAt) == null ? void 0 : _f.toDate) == null ? void 0 : _g.call(_f)
        };
        return queue;
      });
      const queues = await Promise.all(queuesPromises);
      return queues;
    };
    this.getQueueType = async (id) => {
      const doc = await this.queueTypeCollection.doc(id).get();
      if (!doc.exists)
        return null;
      const data = doc.data();
      const queueType = {
        ...data,
        id: doc.id
      };
      return queueType;
    };
    this.getQueueTypes = async () => {
      const result = await this.queueTypeCollection.get();
      const queueTypes = _3.map(result.docs, (doc) => {
        const data = doc.data();
        const queueType = {
          ...data,
          id: doc.id
        };
        return queueType;
      });
      return queueTypes;
    };
  }
}, "QueueService");
QueueService = __decorate9([
  singleton5(),
  autoInjectable9(),
  __param4(0, inject4("QueuesCollection")),
  __param4(1, inject4("QueueTypesCollection")),
  __metadata9("design:type", Function),
  __metadata9("design:paramtypes", [
    typeof CollectionReference4 === "undefined" ? Object : CollectionReference4,
    typeof CollectionReference4 === "undefined" ? Object : CollectionReference4
  ])
], QueueService);

// src/queue/handler.ts
import HyperExpress3 from "hyper-express";
import { autoInjectable as autoInjectable10 } from "tsyringe";

// src/queue/schema.ts
import Joi3 from "joi";
var addQueueSchema = Joi3.object({
  bodyTemperature: Joi3.number().required(),
  bloodPressure: Joi3.object({
    systolic: Joi3.number().required(),
    diastolic: Joi3.number().required()
  }).required(),
  typeId: Joi3.string().required(),
  patientId: Joi3.string().required()
}).options({
  allowUnknown: true
});

// src/queue/handler.ts
var __decorate10 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata10 = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var QueueHandler = /* @__PURE__ */ __name(class QueueHandler2 {
  constructor(queueService, patientService) {
    this.queueService = queueService;
    this.patientService = patientService;
    this.socket = (_io, _socket) => {
    };
    this.routes = (middlewares = []) => {
      const r = new HyperExpress3.Router();
      r.use("/queues", ...middlewares);
      r.get("/queues", this.getQueues);
      r.post("/queues", this.addQueue);
      r.get("/queue-types", this.getQueueTypes);
      r.post("/patients/:patientId/queues", this.addQueue);
      return r;
    };
    this.addQueue = async (req, res) => {
      var _a;
      const requestBody = await req.json();
      if ((_a = req.path_parameters) == null ? void 0 : _a.patientId) {
        requestBody.patientId = req.path_parameters.patientId;
      }
      const { error } = addQueueSchema.validate(requestBody);
      if (error) {
        res.status(400).json({
          status: false,
          data: null,
          error: error.message
        });
        return;
      }
      try {
        const [patient, queueType] = await Promise.all([
          this.patientService.getPatient(requestBody.patientId),
          this.queueService.getQueueType(requestBody.typeId)
        ]);
        if (!patient) {
          res.status(400).json({
            status: false,
            data: null,
            error: "Patient not found"
          });
          return;
        }
        if (!queueType) {
          res.status(400).json({
            status: false,
            data: null,
            error: "Queue type not found"
          });
          return;
        }
        const queue = {
          id: "",
          bodyTemperature: requestBody.bodyTemperature,
          bloodPressure: {
            systolic: requestBody.bloodPressure.systolic,
            diastolic: requestBody.bloodPressure.diastolic
          },
          type: {
            id: queueType.id,
            name: queueType.name
          },
          patient: {
            id: patient.id,
            name: patient.name,
            dateOfBirth: patient.dateOfBirth
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const result = await this.queueService.addQueue(queue);
        res.status(201).json({
          status: true,
          data: result,
          error: null
        });
      } catch (error1) {
        console.error(error1);
        res.status(error1.httpStatusCode || 500).json({
          status: false,
          data: null,
          error: error1.message
        });
      }
    };
    this.getQueues = async (_req, res) => {
      try {
        const queues = await this.queueService.getQueues();
        res.json({
          status: true,
          data: queues,
          error: null
        });
      } catch (error) {
        console.error(error);
        res.status(error.httpStatusCode || 500).json({
          status: false,
          data: [],
          error: error.message
        });
      }
    };
    this.getQueueTypes = async (_req, res) => {
      try {
        const queueTypes = await this.queueService.getQueueTypes();
        res.json({
          status: true,
          data: queueTypes,
          error: null
        });
      } catch (error) {
        console.error(error);
        res.status(error.httpStatusCode || 500).json({
          status: false,
          data: [],
          error: error.message
        });
      }
    };
  }
}, "QueueHandler");
QueueHandler = __decorate10([
  autoInjectable10(),
  __metadata10("design:type", Function),
  __metadata10("design:paramtypes", [
    typeof QueueService === "undefined" ? Object : QueueService,
    typeof PatientService === "undefined" ? Object : PatientService
  ])
], QueueHandler);

// src/index.ts
import { container } from "tsyringe";
var main = /* @__PURE__ */ __name(async () => {
  try {
    const firestore = connectToFirestore();
    container.register("Firestore", {
      useValue: firestore
    });
    container.register("PoliciesCollection", {
      useValue: firestore.collection("Policies")
    });
    container.register("UsersCollection", {
      useValue: firestore.collection("Users")
    });
    container.register("PatientsCollection", {
      useValue: firestore.collection("Patients")
    });
    container.register("QueuesCollection", {
      useValue: firestore.collection("Queues")
    });
    container.register("QueueTypesCollection", {
      useValue: firestore.collection("QueueTypes")
    });
    const authHandler = container.resolve(AuthHandler);
    const patientHandler = container.resolve(PatientHandler);
    const queueHandler = container.resolve(QueueHandler);
    const app = new HyperExpress4.Server();
    const io = new Server();
    const port = Number(process.env.PORT) || 3e3;
    io.attachApp(app.uws_instance);
    io.on("connection", (socket) => {
      queueHandler.socket(io, socket);
    });
    app.use("/api", authHandler.routes());
    app.use("/api", patientHandler.routes([
      authHandler.middleware.verifyAccessToken
    ]));
    app.use("/api", queueHandler.routes([
      authHandler.middleware.verifyAccessToken
    ]));
    await app.listen(port);
    console.log("Listening to port " + port);
  } catch (error) {
    console.error(error);
    console.error("Failed to start server");
    process.exit(1);
  }
}, "main");
main();
//# sourceMappingURL=index.js.map