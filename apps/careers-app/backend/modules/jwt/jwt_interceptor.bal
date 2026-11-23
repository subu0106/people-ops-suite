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

import wso2/careers_app.types;

import ballerina/cache;
import ballerina/http;
import ballerina/jwt;
import ballerina/log;
import ballerina/time;

final UserRateLimiter signedInRateLimiter = new;

# The header in which the gateway sends the caller's assertion. The gateway has already checked the token, so the
# assertion is read without checking its signature again; the backend must be reachable through the gateway only.
const GATEWAY_ASSERTION_HEADER = "x-jwt-assertion";

# The caller's identity and details in a gateway assertion.
#
# + assertion - The assertion
# + return - The identity and the details, or an error when the assertion cannot be read or has run out
isolated function identityFromAssertion(string assertion) returns [AsgardeoJwt, CallerDetails]|error {
    [jwt:Header, jwt:Payload] [_, payload] = check jwt:decode(assertion);
    int? expiry = payload?.exp;
    if expiry is int && expiry < time:utcNow()[0] {
        return error("The gateway assertion has run out");
    }
    AsgardeoJwt user = check identityOf(payload);
    return [user, detailsOf(payload.toJson())];
}

# Keeps the caller's details where the user-info call looks first, so the request needs no access token.
#
# + user - The caller
# + details - The details from the assertion
isolated function keepAssertionDetails(AsgardeoJwt user, CallerDetails details) {
    cache:Error? stored = detailsCache.put(user.sub, details.cloneReadOnly());
    if stored is cache:Error {
        log:printWarn("Could not keep the caller's details in the cache", stored);
    }
}

# Reads the caller from the assertion the Choreo gateway adds to every request, as the People app does, and stashes
# their identity in the request context for resource functions. The gateway has already checked the token.
public isolated service class JwtInterceptor {
    *http:RequestInterceptor;

    isolated resource function 'default [string... path](http:RequestContext ctx, http:Request req)
            returns http:NextService|AppUnauthorizedError|AppTooManyRequestsError|error? {
        if req.method == http:OPTIONS {
            return ctx.next();
        }

        string|http:HeaderNotFoundError assertion = req.getHeader(GATEWAY_ASSERTION_HEADER);
        if assertion is http:HeaderNotFoundError {
            log:printError("Missing invoker info header", requestId = types:requestIdOf(ctx));
            return <AppUnauthorizedError>{body: {message: "Unauthorized"}};
        }

        [AsgardeoJwt, CallerDetails]|error caller = identityFromAssertion(assertion);
        if caller is error {
            log:printError("Error while reading the invoker info", caller, requestId = types:requestIdOf(ctx));
            return <AppUnauthorizedError>{body: {message: "Unauthorized"}};
        }
        AsgardeoJwt user = caller[0];

        if !signedInRateLimiter.tryAcquireUser(user.sub) {
            log:printWarn("Request rate limit reached for a signed-in user", requestId = types:requestIdOf(ctx));
            return <AppTooManyRequestsError>{
                headers: {"Retry-After": signedInWindowSeconds.toString()},
                body: {message: "Too many requests"}
            };
        }

        // The details come with the assertion, so the routes need no access token to ask the identity provider.
        keepAssertionDetails(user, caller[1]);
        ctx.set(CTX_USER, user);
        ctx.set(CTX_TOKEN, "");
        return ctx.next();
    }
}

# Marks the responses to a signed-in caller as not to be stored by browsers or intermediaries.
public isolated service class NoStoreInterceptor {
    *http:ResponseInterceptor;

    isolated remote function interceptResponse(http:RequestContext ctx, http:Response res)
            returns http:NextService|error? {
        if ctx.hasKey(CTX_USER) {
            res.setHeader(http:CACHE_CONTROL, "no-store");
        }
        return ctx.next();
    }
}
