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

import ballerina/http;
import ballerina/jwt;

isolated function identityOf(jwt:Payload payload) returns AsgardeoJwt|error {
    string? sub = payload?.sub;
    if sub is () || sub == "" {
        return error("Invalid token: missing sub");
    }
    return {sub};
}

isolated function textOf(json value) returns string => value is string ? value.trim() : "";

isolated function detailsOf(json userInfo) returns CallerDetails {
    if userInfo !is map<json> {
        return {};
    }
    return {
        email: textOf(userInfo["email"]).toLowerAscii(),
        firstName: textOf(userInfo["given_name"]),
        lastName: textOf(userInfo["family_name"]),
        gender: textOf(userInfo["gender"]),
        contactNo: textOf(userInfo["phone_number"])
    };
}

# The validated caller, read back from the request context.
public isolated function getUser(http:RequestContext ctx) returns AsgardeoJwt|error {
    return ctx.getWithType(CTX_USER);
}