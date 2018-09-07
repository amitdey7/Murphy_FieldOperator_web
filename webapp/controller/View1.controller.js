sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/BusyDialog"
], function(Controller, JSONModel, MessageToast, BusyDialog) {
	"use strict";

	return Controller.extend("com.Murphy.FieldTaskFieldTask.controller.View1", {
		onInit: function() {
			this.oBusyDialog = new BusyDialog();
			var oUserModel = new JSONModel();
			this.getView().setModel(oUserModel, "oUserModel");
			var oAllUsersModel = new JSONModel();
			this.getView().setModel(oAllUsersModel, "oAllUsersModel");
			var oTaskDetailsModel = new JSONModel();
			this.getView().setModel(oTaskDetailsModel, "oTaskDetailsModel");
			this.getUserDetails();
		},
		//function to fetch logged user attributes
		getUserDetails: function() {
			this.oBusyDialog.open();
			var sUrl = "/services/userapi/attributes";
			var oModel = new sap.ui.model.json.JSONModel();
			var that = this;
			oModel.loadData(sUrl, true, "GET", false, false);
			oModel.attachRequestCompleted(function(oEvent) {
				if (oEvent.getParameter("success")) {
					var resultData = oEvent.getSource().getData();
					if (resultData) {
						that.getLoggedUserDetails(resultData.userId);
						that.getAllTasks(resultData.userId);
						that.oBusyDialog.close();
					}
				} else {
					MessageToast.show("Error in Retrieving User Details");
					that.oBusyDialog.close();
				}
			});
			oModel.attachRequestFailed(function(oEvent) {
				MessageToast.show("Error in Retrieving User Details");
				that.oBusyDialog.close();
			});
		},
		//function to fetch logged in user details from IDP
		getLoggedUserDetails: function(oUserId) {
			var oUserModel = this.getView().getModel("oUserModel");
			var sUrl = "/destination/MurphyCloudIdPDest/service/scim/Users/" + oUserId;
			var oModel = new sap.ui.model.json.JSONModel();
			var that = this;
			oModel.loadData(sUrl, true, "GET", false, false);
			oModel.attachRequestCompleted(function(oEvent) {
				if (oEvent.getParameter("success")) {
					var resultData = oEvent.getSource().getData();
					if (resultData) {
						oUserModel.setData(resultData);
						oUserModel.refresh(true);
					}
				} else {
					MessageToast.show("Error in Retrieving User Details from IDP");
					that.oBusyDialog.close();
				}
			});
			oModel.attachRequestFailed(function(oEvent) {
				MessageToast.show("Error in Retrieving User Details from IDP");
				that.oBusyDialog.close();
			});
		},
		getAllTasks: function(userId) {
			var sUrl = "/taskmanagementRest/tasks/getTasksByUser?userId=neelam.raj@incture.com&userType=FIELD&origin=Custom";
			var oModel = new sap.ui.model.json.JSONModel();
			var that = this;
			var oAllUsersModel = this.getView().getModel("oAllUsersModel");
			oModel.loadData(sUrl, true, "GET", false, false);
			oModel.attachRequestCompleted(function(oEvent) {
				if (oEvent.getParameter("success")) {
					var resultData = oEvent.getSource().getData();
					if (resultData) {
						oAllUsersModel.setData(resultData);
						for (var i = 0; i < resultData.taskList.length; i++) {
							var sDesc = resultData.taskList[i].description.split("/")[0].split("-")[1];
							var sSubDesc = resultData.taskList[i].description.split("/")[1];
							oAllUsersModel.getData().taskList[i].desc = sDesc;
							oAllUsersModel.getData().taskList[i].subDesc = sSubDesc;
						}
						oAllUsersModel.refresh(true);
						that.oBusyDialog.close();
					}
				} else {
					MessageToast.show("Error in Retrieving User Details");
					that.oBusyDialog.close();
				}
			});
			oModel.attachRequestFailed(function(oEvent) {
				MessageToast.show("Error in Retrieving User Details");
				that.oBusyDialog.close();
			});

		},
		onMyReqItemPress: function(oEvent) {
			this.oViewDetailsDialog = sap.ui.xmlfragment("com.Murphy.FieldTaskFieldTask.fragments.FieldTaskDetails", this);
			this.getView().addDependent(this.oViewDetailsDialog);
			var sIndex = oEvent.getSource().getParent().getParent().getBindingContextPath().split("/taskList/")[1];
			var oData = this.getView().getModel("oAllUsersModel").getData().taskList[sIndex];
			var oTaskDetailsModel = this.getView().getModel("oTaskDetailsModel");
			oTaskDetailsModel.setData(oData);
			oTaskDetailsModel.refresh(true);
			this.oViewDetailsDialog.open();
		},
		onResolve: function() {
			var that = this;
			var sUrl = "/taskmanagementRest/tasks/updateStatus";
			var oData = this.getView().getModel("oTaskDetailsModel").getData();
			var oUserData = this.getView().getModel("oUserModel").getData();
			var oPayload = {
				"taskId": oData.taskId,
				"status": "RESOLVED",
				"userId": oUserData.emails[0].value,
				"userDisplay": oUserData.userName,
				"rootCauseList": [{
					"rootCause": "rootCauseRESOLVED",
					"status": "RESOLVED",
					"subClassification": oData.subDesc,
					"description": oData.desc
				}]

			};
			var oHeader = {
				"Content-Type": "application/json"
			};
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.loadData(sUrl, JSON.stringify(oPayload), true, "POST", false, false, oHeader);
			oModel.attachRequestCompleted(function(oEvent) {
				if (oEvent.getSource().getData().status === "SUCCESS") {
					that.oBusyDialog.close();
					MessageToast.show(oEvent.getSource().getData().message);
					that.getAllTasks();
					that.oViewDetailsDialog.close();
				} else {
					MessageToast.show("Error in Retrieving User Details");
					that.oBusyDialog.close();
				}
			});
			oModel.attachRequestFailed(function(oEvent) {
				MessageToast.show("Error in Retrieving User Details");
				that.oBusyDialog.close();
			});
		},
		onReturn: function() {
			var that = this;
			var sUrl = "/taskmanagementRest/tasks/updateStatus";
			var oData = this.getView().getModel("oTaskDetailsModel").getData();
			var oUserData = this.getView().getModel("oUserModel").getData();
			var oPayload = {
				"taskId": oData.taskId,
				"status": "RETURNED",
				"userId": oUserData.emails[0].value,
				"userDisplay": oUserData.userName,
				"rootCauseList": [{
					"rootCause": "rootCauseReturned",
					"status": "RETURNED",
					"subClassification": oData.subDesc,
					"description": oData.desc
				}]

			};
			var oHeader = {
				"Content-Type": "application/json"
			};
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.loadData(sUrl, JSON.stringify(oPayload), true, "POST", false, false, oHeader);
			oModel.attachRequestCompleted(function(oEvent) {
				if (oEvent.getSource().getData().status === "SUCCESS") {
					that.oBusyDialog.close();
					MessageToast.show(oEvent.getSource().getData().message);
					that.getAllTasks();
					that.oViewDetailsDialog.close();
				} else {
					MessageToast.show("Error in Retrieving User Details");
					that.oBusyDialog.close();
				}
			});
			oModel.attachRequestFailed(function(oEvent) {
				MessageToast.show("Error in Retrieving User Details");
				that.oBusyDialog.close();
			});
		},
		onClosefrag: function() {
			this.oViewDetailsDialog.close();
		}
	});
});