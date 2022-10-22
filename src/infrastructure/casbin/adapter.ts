import _ from "lodash";
import { Adapter, Assertion, BatchAdapter, Helper, Model } from "casbin";
import { CollectionReference, Firestore, WriteBatch } from "firebase-admin/firestore";
import { autoInjectable, inject } from "tsyringe";

type Policy = {
  [key: string]: string | undefined;

  ptype: string;
  v0?: string;
  v1?: string;
  v2?: string;
  v3?: string;
  v4?: string;
  v5?: string;
};

@autoInjectable()
export class CasbinAdapter implements Adapter, BatchAdapter {
  private maxWritesPerBatch = 500;

  constructor(
    @inject("Firestore") private firestore: Firestore,
    @inject("PoliciesCollection") private policiesCollection: CollectionReference,
  ) {}

  loadPolicy = async (model: Model) => {
    const policiesRes = await this.policiesCollection.get();

    if (policiesRes.empty) return;

    _.each(policiesRes.docs, (policyDoc) => {
      const policy = policyDoc.data() as Policy;

      policy.id = policyDoc.id;

      loadPolicyLine(policy, model);
    });
  };

  savePolicy = async (model: Model) => {
    try {
      const batch = this.firestore.batch();

      const policiesRes = await this.policiesCollection.get();

      _.each(policiesRes.docs, (policyDoc) => {
        batch.delete(policyDoc.ref);
      });

      const pPolicies = createPoliciesFromAstMap(model.model.get("p"));
      const gPolicies = createPoliciesFromAstMap(model.model.get("g"));
      const combinedPolicies = [...pPolicies, ...gPolicies];

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

  addPolicy = async (_sec: string, ptype: string, rule: string[]) => {
    const policy = createPolicy(ptype, rule);
    await this.policiesCollection.add(policy);
  };

  addPolicies = async (_sec: string, ptype: string, rules: string[][]) => {
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

  /** you must commit the batch by **yourself** after calling this method */
  private batchRemovePolicies = async (batch: WriteBatch, policies: Policy[]) => {
    const deletePromises = _.map(policies, async (policy) => {
      const policiesRes = await this.policiesCollection
        .where("ptype", "==", policy.ptype)
        .where("v0", "==", policy.v0)
        .where("v1", "==", policy.v1)
        .where("v2", "==", policy.v2)
        .where("v3", "==", policy.v3)
        .where("v4", "==", policy.v4)
        .where("v5", "==", policy.v5)
        .limit(1)
        .get();

      if (policiesRes.empty) return;

      _.each(policiesRes.docs, (policyDoc) => {
        batch.delete(policyDoc.ref);
      });
    });

    await Promise.all(deletePromises);
  };

  removePolicy = async (sec: string, ptype: string, rule: string[]) => {
    await this.removePolicies(sec, ptype, [rule]);
  };

  removePolicies = async (_sec: string, ptype: string, rules: string[][]) => {
    const deleteChunks = _.chunk(rules, this.maxWritesPerBatch);
    const deletePromises = _.map(deleteChunks, async (chunk) => {
      const batch = this.firestore.batch();
      const policies = chunk.map((rule) => createPolicy(ptype, rule));
      await this.batchRemovePolicies(batch, policies);
      await batch.commit();
    });

    await Promise.all(deletePromises);
  };

  removeFilteredPolicy = async (
    _sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ) => {
    const filteredPolicy = createFilteredPolicy(ptype, fieldIndex, ...fieldValues);
    const batch = this.firestore.batch();
    await this.batchRemovePolicies(batch, [filteredPolicy]);
    await batch.commit();
  };
}

function loadPolicyLine(policy: Policy, model: Model) {
  const ps = [policy.v0, policy.v1, policy.v2, policy.v3, policy.v4, policy.v5];
  const policyLine = policy.ptype + ", " + _.compact(ps).join(", ");

  Helper.loadPolicyLine(policyLine, model);
}

function createPolicy(ptype: string, rule: readonly string[]) {
  if (rule.length === 3) {
    return {
      ptype,
      v0: rule[0],
      v1: rule[1],
      v2: rule[2],
    };
  }

  return _.reduce(
    rule,
    (acc: Policy, _value, index) => {
      acc[`v${index}`] = rule[index];
      return acc;
    },
    { ptype },
  );
}

function createPoliciesFromAstMap(astMap: Map<string, Assertion> | undefined) {
  const policies: Policy[] = [];

  if (!astMap) return policies;

  astMap.forEach((ast, ptype) => {
    _.each(ast.policy, (rule) => {
      policies.push(createPolicy(ptype, rule));
    });
  });

  return policies;
}

function createFilteredPolicy(ptype: string, fieldIndex: number, ...fieldValues: string[]): Policy {
  const filteredPolicy: Policy = { ptype };

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
