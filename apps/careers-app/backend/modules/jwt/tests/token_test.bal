// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import ballerina/jwt;
import ballerina/test;

@test:Config {}
function identityIsTheSubject() {
    jwt:Payload payload = {sub: "user-1"};
    test:assertEquals(identityOf(payload), {sub: "user-1"});
}

@test:Config {}
function identityNeedsASubject() {
    test:assertTrue(identityOf({iss: "issuer"}) is error);
    test:assertTrue(identityOf({sub: ""}) is error);
}

@test:Config {}
function detailsComeFromTheUserInfo() {
    CallerDetails details = detailsOf({
        "sub": "u",
        "email": " Ada@Example.test ",
        "given_name": " Ada ",
        "family_name": "Lovelace",
        "gender": "female",
        "phone_number": "+94771234567"
    });
    test:assertEquals(details.email, "ada@example.test");
    test:assertEquals(details.firstName, "Ada");
    test:assertEquals(details.lastName, "Lovelace");
    test:assertEquals(details.gender, "female");
    test:assertEquals(details.contactNo, "+94771234567");
}

@test:Config {}
function missingUserInfoValuesAreEmptyText() {
    CallerDetails unknown = {};
    test:assertEquals(detailsOf({"sub": "u", "email": "  "}), unknown);
    test:assertEquals(detailsOf({"sub": "u", "given_name": 5}), unknown);
    test:assertEquals(detailsOf("not an object"), unknown);
}


// Assertions in the shape the gateway sends them; the signature is not read, so it is a fixed text. The first expires
// in the year 2100, the second has no subject, and the third expired in 1970.
const VALID_ASSERTION = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6Ik1hcnkuU2lsdmFAZXhhbXBsZS50ZXN0IiwiZ2l2ZW5fbmFtZSI6Ik1hcnkgQW5uIiwiZmFtaWx5X25hbWUiOiJTaWx2YSIsImV4cCI6NDEwMjQ0NDgwMH0.c2ln";
const ASSERTION_WITHOUT_SUBJECT = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1hcnkuc2lsdmFAZXhhbXBsZS50ZXN0IiwiZXhwIjo0MTAyNDQ0ODAwfQ.c2ln";
const EXPIRED_ASSERTION = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjF9.c2ln";

@test:Config {}
function theAssertionGivesTheCallerAndTheirDetails() returns error? {
    [AsgardeoJwt, CallerDetails] caller = check identityFromAssertion(VALID_ASSERTION);
    test:assertEquals(caller[0].sub, "user-1");
    test:assertEquals(caller[1].email, "mary.silva@example.test");
    test:assertEquals(caller[1].firstName, "Mary Ann");
    test:assertEquals(caller[1].lastName, "Silva");
}

@test:Config {}
function anAssertionWithoutASubjectIsRefused() {
    test:assertTrue(identityFromAssertion(ASSERTION_WITHOUT_SUBJECT) is error);
}

@test:Config {}
function anAssertionThatHasExpiredIsRefused() {
    test:assertTrue(identityFromAssertion(EXPIRED_ASSERTION) is error);
}

@test:Config {}
function textThatIsNotAnAssertionIsRefused() {
    test:assertTrue(identityFromAssertion("not-an-assertion") is error);
    test:assertTrue(identityFromAssertion("") is error);
}
