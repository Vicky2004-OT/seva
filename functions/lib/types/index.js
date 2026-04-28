"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightType = exports.SurveyStatus = exports.QuestionType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["ANALYST"] = "analyst";
    UserRole["NGO"] = "ngo";
    UserRole["FIELD_WORKER"] = "field_worker";
})(UserRole || (exports.UserRole = UserRole = {}));
var QuestionType;
(function (QuestionType) {
    QuestionType["TEXT"] = "text";
    QuestionType["NUMBER"] = "number";
    QuestionType["EMAIL"] = "email";
    QuestionType["PHONE"] = "phone";
    QuestionType["DATE"] = "date";
    QuestionType["TIME"] = "time";
    QuestionType["MULTIPLE_CHOICE"] = "multiple_choice";
    QuestionType["CHECKBOX"] = "checkbox";
    QuestionType["RATING"] = "rating";
    QuestionType["LOCATION"] = "location";
    QuestionType["PHOTO"] = "photo";
    QuestionType["FILE"] = "file";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var SurveyStatus;
(function (SurveyStatus) {
    SurveyStatus["DRAFT"] = "draft";
    SurveyStatus["PUBLISHED"] = "published";
    SurveyStatus["CLOSED"] = "closed";
    SurveyStatus["ARCHIVED"] = "archived";
})(SurveyStatus || (exports.SurveyStatus = SurveyStatus = {}));
var InsightType;
(function (InsightType) {
    InsightType["TREND"] = "trend";
    InsightType["ANOMALY"] = "anomaly";
    InsightType["PATTERN"] = "pattern";
    InsightType["PREDICTION"] = "prediction";
    InsightType["SUMMARY"] = "summary";
    InsightType["RECOMMENDATION"] = "recommendation";
})(InsightType || (exports.InsightType = InsightType = {}));
