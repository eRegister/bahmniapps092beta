'use strict';

describe("calendarViewController", function () {

    var controller, rootScope, scope, stateParams;
    var state = jasmine.createSpyObj('$state', ['go']);
    var patientService = jasmine.createSpyObj('patientService', ['search']);
    var locationService = jasmine.createSpyObj('locationService', ['getAllByTag']);
    var appService = jasmine.createSpyObj('appService', ['getAppDescriptor']);
    var appDescriptor = jasmine.createSpyObj('appDescriptor', ['getConfigValue']);
    var ngDialog = jasmine.createSpyObj('ngDialog', ['open']);
    appService.getAppDescriptor.and.returnValue(appDescriptor);

    appDescriptor.getConfigValue.and.callFake(function (value) {
        if (value == 'calendarView') {
            return {dayViewStart: "09:00",
                dayViewEnd: "17:00",
                dayViewSplit: "60"};
        }
    });

    patientService.search.and.returnValue(specUtil.simplePromise({data: {results: [{name: "new Patient", uuid: "patientUuid"}]}}));
    locationService.getAllByTag.and.returnValue(specUtil.simplePromise({data: {results: [{uuid: "uuid1", name: "location1"}, {uuid: "uuid2", name: "location2"}]}}));

    beforeEach(function () {
        module('bahmni.ot');
        inject(function ($controller, $rootScope) {
            controller = $controller;
            rootScope = $rootScope;
            scope = $rootScope.$new();
            stateParams = {};
        });
    });

    var createController = function () {
        controller('calendarViewController', {
            $rootScope: rootScope,
            $scope: scope,
            $state: state,
            appService: appService,
            patientService: patientService,
            locationService: locationService,
            ngDialog: ngDialog,
            $stateParams: stateParams
        });
    };

    var surgicalBlocks = [
        {
            id: 60,
            provider: {uuid: "providerUuid1", display: "Doctor Strange"},
            location: {uuid: "uuid1", name: "location1"},
            surgicalAppointments: [ {id: 48, surgicalAppointmentAttributes: []}],
            startDatetime: "2001-10-04T09:00:00.000+0530",
            endDatetime: "2001-10-04T21:00:00.000+0530",
            uuid: "surgical-block1-uuid"
        },
        {
            id: 61,
            provider: {uuid: "providerUuid2", display: "Doctor Malhotra"},
            location: {uuid: "uuid2", name: "location2"},
            surgicalAppointments: [],
            startDatetime: "2001-10-04T09:00:00.000+0530",
            endDatetime: "2001-10-04T21:00:00.000+0530"
        }
    ];

    it('should go to the previous date on click of left arrow', function () {
        createController();
        scope.viewDate = new Date(moment('2017-02-01').startOf('day'));
        scope.goToPreviousDate(scope.viewDate);
        expect(scope.viewDate).toEqual((moment('2017-01-31').startOf('day')).toDate());
        expect(state.viewDate).toEqual((moment('2017-01-31').startOf('day')).toDate());
    });

    it('should go to the next date on click of right arrow', function () {
        createController();
        scope.viewDate = new Date(moment('2017-02-01').startOf('day'));
        scope.goToNextDate(scope.viewDate);
        expect(scope.viewDate).toEqual((moment('2017-02-02').startOf('day')).toDate());
        expect(state.viewDate).toEqual((moment('2017-02-02').startOf('day')).toDate());
    });

    it('should go to the current date on click of today', function () {
        createController();
        scope.goToCurrentDate();
        expect(scope.viewDate).toEqual((moment().startOf('day')).toDate());
        expect(state.viewDate).toEqual((moment().startOf('day')).toDate());
    });

    it('Should search the patient with the given search string', function () {
        createController();
        scope.patient = "new pat";
        scope.search();
        expect(patientService.search).toHaveBeenCalledWith(scope.patient);
    });

    it('Should add the patient info onto the filter parameters on selecting the patient', function () {
        createController();
        var patientInfo = {name: "new Patient", uuid: "patientUuid", identifier: "EQ10001"};
        scope.onSelectPatient(patientInfo);
        expect(scope.filters.patient).toBe(patientInfo);
    });

    it('Should clear the patient filter from filter parameters upon clearing the patient info', function () {
        createController();
        var patientInfo = {name: "new Patient", uuid: "patientUuid", identifier: "EQ10001"};
        scope.clearThePatientFilter(patientInfo);
        expect(scope.filters.patient).toBe(null);
    });

    it('Should map the response of search results from the server and add label field', function () {
        createController();
        var patientInfo = {givenName: "new", familyName: "Patient", uuid: "patientUuid", identifier: "EQ10001"};
        var responseMap = scope.responseMap([patientInfo]);
        expect(responseMap[0].givenName).toBe("new");
        expect(responseMap[0].familyName).toBe("Patient");
        expect(responseMap[0].uuid).toBe("patientUuid");
        expect(responseMap[0].identifier).toBe("EQ10001");
        expect(responseMap[0].label).toBe("new Patient (EQ10001)");
    });

    it('Should clear all the filters', function () {
        var fakeSurgeonInput = document.createElement("input");
        var fakeStatusInput = document.createElement("input");
        fakeSurgeonInput.setAttribute("class", "input");
        fakeStatusInput.setAttribute("class", "input");
        document.body.appendChild(fakeSurgeonInput);
        document.body.appendChild(fakeStatusInput);
        createController();
        scope.clearFilters();
        expect(scope.filters.providers).toEqual([]);
        expect(scope.filters.statusList).toEqual([]);
        expect(scope.patient).toBe("");
        expect(scope.filters.patient).toBe(null);
    });

    it('Should apply all the filters', function () {

        createController();
        scope.filters = {locations: {"location1": true, "location2": false}, providers: [{uuid: "providerUuid1"}],
            patient: {uuid: "patientUuid2", value: "firstName2 lastName2", identifier: "IQ10002"},
            statusList: [{name: "COMPLETED"}]
        };
        scope.applyFilters();
        expect(scope.filterParams).toEqual(scope.filters);
        expect(state.filterParams).toEqual(scope.filters);
    });

    it('Should initialize the filter data', function () {
        rootScope.surgeons = [{
            "uuid": "batmanUuid",
            "person": {
                "display": "Bat Man"
            },
            "attributes": [
                {
                    "attributeType": {
                        "display": "otCalendarColor"
                    },
                    "value": "90"
                }
            ]
        },
            {
                "uuid": "spidermanUuid",
                "person": {
                    "display": "Spider Man"
                },
                "attributes": []
            }];

        var mappedSurgeons = [{name: "Bat Man", uuid: "batmanUuid", "Bat Man": false, otCalendarColor: "hsl(90, 100%, 90%)"}, {name: "Spider Man", uuid: "spidermanUuid", "Spider Man": false, otCalendarColor: "hsl(0, 100%, 90%)"}];
        state.filterParams = undefined;
        createController();
        expect(scope.filters.locations).toEqual({"location1": true, "location2": true});
        expect(scope.filters.providers).toEqual([]);
        expect(scope.filters.statusList).toEqual([]);
        expect(scope.appointmentStatusList).toEqual([{name: "SCHEDULED"}, {name: "COMPLETED"}]);
        expect(scope.locations).toEqual([{uuid: "uuid1", name: "location1"}, {uuid: "uuid2", name: "location2"}]);
        expect(scope.surgeonList).toEqual(mappedSurgeons);
        expect(scope.patient).toBeUndefined();
    });

    it('Should initialize the filter data from stateParams if present', function () {
        rootScope.surgeons = [{
            "uuid": "batmanUuid",
            "person": {
                "display": "Bat Man"
            },
            "attributes": [
                {
                    "attributeType": {
                        "display": "otCalendarColor"
                    },
                    "value": "90"
                }
            ]
        },
            {
                "uuid": "spidermanUuid",
                "person": {
                    "display": "Spider Man"
                },
                "attributes": []
            }];
        var mappedSurgeons = [{name: "Bat Man", uuid: "batmanUuid", "Bat Man": false, otCalendarColor: "hsl(90, 100%, 90%)"}, {name: "Spider Man", uuid: "spidermanUuid", "Spider Man": false, otCalendarColor: "hsl(0, 100%, 90%)"}];

        state.filterParams = {locations: {"location1": true, "location2": false}, providers: [{uuid: "providerUuid1"}],
            patient: {uuid: "patientUuid2", value: "firstName2 lastName2", identifier: "IQ10002"},
            statusList: [{name: "COMPLETED"}]
        };
        createController();
        expect(scope.filters).toEqual(state.filterParams);
        expect(scope.filters.locations).toEqual({"location1": true, "location2": false});
        expect(scope.filters.providers).toEqual([{uuid: "providerUuid1"}]);
        expect(scope.filters.statusList).toEqual([{name: "COMPLETED"}]);
        expect(scope.filters.patient).toEqual({uuid: "patientUuid2", value: "firstName2 lastName2", identifier: "IQ10002"});
        expect(scope.appointmentStatusList).toEqual([{name: "SCHEDULED"}, {name: "COMPLETED"}]);
        expect(scope.locations).toEqual([{uuid: "uuid1", name: "location1"}, {uuid: "uuid2", name: "location2"}]);
        expect(scope.surgeonList).toEqual(mappedSurgeons);
        expect(scope.patient).toEqual("firstName2 lastName2");
    });

    it('should navigate to edit surgical block page with surgicalBlock details clicking edit button', function () {
        var event = {
            stopPropagation: function () {
            }
        };
        createController();
        scope.surgicalBlockSelected = surgicalBlocks[0];
        scope.goToEdit(event);
        expect(state.go).toHaveBeenCalledWith("editSurgicalAppointment",
            jasmine.objectContaining({surgicalBlockUuid : "surgical-block1-uuid"}));
    });

    it('should navigate to edit surgical block page  with surgical block and appointment details on clicking edit button', function () {
        var event = {
            stopPropagation: function () {
            }
        };
        createController();
        scope.surgicalBlockSelected = surgicalBlocks[0];
        scope.surgicalAppointmentSelected = surgicalBlocks[0].surgicalAppointments[0];
        scope.goToEdit(event);
        expect(state.go).toHaveBeenCalledWith("editSurgicalAppointment",
            jasmine.objectContaining({surgicalBlockUuid : "surgical-block1-uuid", surgicalAppointmentId : 48}));
    });

    it('should navigate to the cancel appointment dialog box when a cancel Appointment is clicked', function () {
        createController();
        scope.surgicalBlockSelected = surgicalBlocks[0];
        scope.surgicalAppointmentSelected = surgicalBlocks[0].surgicalAppointments[0];
        scope.cancelSurgicalBlockOrSurgicalAppointment();

        expect(ngDialog.open).toHaveBeenCalledWith(jasmine.objectContaining({
            template: "views/cancelAppointment.html",
            closeByDocument: false,
            controller: "calendarViewCancelAppointmentController",
            className: 'ngdialog-theme-default ng-dialog-adt-popUp ot-dialog',
            showClose: true,
            data: {
                surgicalBlock: scope.surgicalBlockSelected,
                surgicalAppointment: scope.surgicalAppointmentSelected
            }
        }));
    });

    it('should navigate to the cancel block dialog box when a cancel block is clicked', function () {
        createController();
        scope.surgicalBlockSelected = surgicalBlocks[0];
        scope.surgicalBlockSelected.provider = {person: {display:"something"}};
        scope.cancelSurgicalBlockOrSurgicalAppointment();

        expect(ngDialog.open).toHaveBeenCalledWith(jasmine.objectContaining({
            template: "views/cancelSurgicalBlock.html",
            closeByDocument: false,
            controller: "cancelSurgicalBlockController",
            className: 'ngdialog-theme-default ng-dialog-adt-popUp ot-dialog',
            showClose: true,
            data: {
                surgicalBlock: scope.surgicalBlockSelected,
                provider: scope.surgicalBlockSelected.provider.person.display
            }
        }));
    });

    it('should go to the current week on click of week', function () {
        createController();
        scope.goToCurrentWeek();
        expect(scope.weekOrDay).toEqual('week');
        expect(state.weekOrDay).toEqual('week');
        expect(scope.weekStartDate).toEqual(new Date(moment().startOf('week')));
        expect(state.weekStartDate).toEqual(new Date(moment().startOf('week')));
        expect(scope.weekEndDate).toEqual(new Date(moment().endOf('week').endOf('day')));
        expect(state.weekEndDate).toEqual(new Date(moment().endOf('week').endOf('day')));
    });

    it('should go to next week on click of right arrow in week view', function() {
       createController();
       scope.weekStartDate = new Date(moment().startOf('week'));
       scope.weekEndDate = new Date(moment().endOf('week').endOf('day'));
       scope.goToNextWeek();
       expect(scope.weekStartDate).toEqual(Bahmni.Common.Util.DateUtil.addDays(new Date(moment().startOf('week')), 7));
       expect(state.weekStartDate).toEqual(Bahmni.Common.Util.DateUtil.addDays(new Date(moment().startOf('week')), 7));
       expect(scope.weekEndDate ).toEqual(Bahmni.Common.Util.DateUtil.addDays(new Date(moment().endOf('week').endOf('day')), 7));
       expect(state.weekEndDate ).toEqual(Bahmni.Common.Util.DateUtil.addDays(new Date(moment().endOf('week').endOf('day')), 7));
    });

    it('should go to previous week on click of left arrow in week view', function() {
       createController();
       scope.weekStartDate = new Date(moment().startOf('week'));
       scope.weekEndDate = new Date(moment().endOf('week').endOf('day'));
       scope.goToPreviousWeek();
       expect(scope.weekStartDate).toEqual(Bahmni.Common.Util.DateUtil.subtractDays(new Date(moment().startOf('week')), 7));
       expect(state.weekStartDate).toEqual(Bahmni.Common.Util.DateUtil.subtractDays(new Date(moment().startOf('week')), 7));
       expect(scope.weekEndDate ).toEqual(Bahmni.Common.Util.DateUtil.subtractDays(new Date(moment().endOf('week').endOf('day')), 7));
       expect(state.weekEndDate ).toEqual(Bahmni.Common.Util.DateUtil.subtractDays(new Date(moment().endOf('week').endOf('day')), 7));
    });

    it('should set scope params to state params if state params are present', function () {
        state.view = 'List View';
        state.weekOrDay = 'week';
        state.weekStartDate = new Date(moment('2017-02-01').startOf('week'));
        state.weekEndDate = new Date(moment('2017-02-01').endOf('week').endOf('day'));
        var filters = {locations: {"location1": true, "location2": false, "location3": true},
            providers: [{uuid: "providerUuid1"}],
            patient: {uuid: "patientUuid2", value: "firstName2 lastName2", identifier: "IQ10002"},
            statusList: [{name: "COMPLETED"}]
        };
        state.filterParams = filters;
        state.viewDate = new Date(moment('2017-02-01').startOf('day'));
        createController();
        expect(scope.view).toEqual('List View');
        expect(scope.weekOrDay).toEqual('week');
        expect(scope.weekStartDate).toEqual(new Date(moment('2017-02-01').startOf('week')));
        expect(scope.weekEndDate).toEqual(new Date(moment('2017-02-01').endOf('week').endOf('day')));
        expect(scope.filters).toEqual(filters);
        expect(scope.viewDate).toEqual(new Date(moment('2017-02-01').startOf('day')));
    });

    it('should go to calendar view on click of calendar button', function () {
       createController();
       scope.calendarView();
       expect(scope.weekOrDay).toEqual('day');
       expect(scope.view).toEqual('Calendar');
    });

    it('should go to list view on click of list view button', function () {
        createController();
        scope.listView();
        expect(scope.view).toEqual('List View');
    });

    it("should select the completed, scheduled appointment status when patient is selected on Calendar view and no statusList is empty", function () {
        createController();
        var data = {};
        scope.view = 'Calendar';
        scope.filters = {statusList: []};
        scope.onSelectPatient(data);
        expect(scope.filters.statusList).toEqual([ { name : 'SCHEDULED' }, { name : 'COMPLETED' } ]);
    });

    it("should not change the filter status list when some status filters are applied on selection of patient ", function () {
        createController();
        var data = {};
        scope.view = 'Calendar';
        scope.filters = {statusList: [{name: 'SCHEDULED'}]};
        scope.onSelectPatient(data);
        expect(scope.filters.statusList).toEqual([{name: 'SCHEDULED'}]);
    });

    it("should not change the filter status list on patient select in  list view ", function () {
        createController();
        var data = {};
        scope.view = 'List View';
        scope.filters = {statusList: []};
        scope.onSelectPatient(data);
        expect(scope.filters.statusList).toEqual([]);
    });

    it("should fire $watch when the view is changed to Calendar", function () {
        createController();
        scope.view = undefined;
        scope.filters = {statusList: [{name: Bahmni.OT.Constants.completed}, {name: Bahmni.OT.Constants.cancelled}]};
        scope.$digest();
        spyOn(scope, 'applyFilters');
        scope.view = 'Calendar';
        scope.$digest();
        expect(scope.applyFilters).toHaveBeenCalled();
        expect(scope.appointmentStatusList).toEqual([{name: Bahmni.OT.Constants.scheduled}, {name: Bahmni.OT.Constants.completed} ]);
        expect(scope.filters.statusList).toEqual([{name: Bahmni.OT.Constants.completed}]);
    });

    it("should fire $watch when the view is changed to List View", function () {
        createController();
        scope.view = undefined;
        scope.filters = {statusList: [{name: Bahmni.OT.Constants.scheduled}, {name: Bahmni.OT.Constants.completed}, {name: Bahmni.OT.Constants.cancelled}]};
        scope.$digest();
        spyOn(scope, 'applyFilters');
        scope.view = 'List View';
        scope.$digest();
        expect(scope.applyFilters).toHaveBeenCalled();
        expect(scope.appointmentStatusList).toEqual([{name: Bahmni.OT.Constants.scheduled}, {name: Bahmni.OT.Constants.completed},
            {name: Bahmni.OT.Constants.postponed}, {name: Bahmni.OT.Constants.cancelled}]);
        expect(scope.filters.statusList).toEqual([{name: Bahmni.OT.Constants.scheduled},{name: Bahmni.OT.Constants.completed}, {name: Bahmni.OT.Constants.cancelled}]);
    });

    it("move button should be disabled by default", function () {
        createController();
        expect(scope.editDisabled).toBeTruthy();
        expect(scope.moveButtonDisabled).toBeTruthy();
        expect(scope.cancelDisabled).toBeTruthy();
        expect(scope.addActualTimeDisabled).toBeTruthy();
    });

    it('should navigate to the move appointment dialog box when a move Appointment is clicked', function () {
        createController();
        scope.surgicalBlockSelected = surgicalBlocks[0];
        scope.surgicalAppointmentSelected = surgicalBlocks[0].surgicalAppointments[0];
        scope.gotoMove();

        expect(ngDialog.open).toHaveBeenCalledWith(jasmine.objectContaining({
            template: "views/moveAppointment.html",
            closeByDocument: false,
            controller: "moveSurgicalAppointmentController",
            className: 'ngdialog-theme-default ng-dialog-adt-popUp ot-dialog',
            showClose: true,
            data: {
                surgicalBlock: scope.surgicalBlockSelected,
                surgicalAppointment: scope.surgicalAppointmentSelected
            }
        }));
    });

    it("should disable move button when user selects surgical block", function () {
       createController();
       scope.$emit("event:surgicalBlockSelect", {surgicalAppointments: []});
       expect(scope.moveButtonDisabled).toBeTruthy();
       expect(scope.editDisabled).toBeFalsy();
       expect(scope.addActualTimeDisabled).toBeTruthy();
       expect(scope.cancelDisabled).toBeFalsy();
    });

    it("should disable move button when user deselects surgical block", function () {
       createController();
       scope.$emit("event:surgicalBlockDeselect", {surgicalAppointments: []});
       expect(scope.moveButtonDisabled).toBeTruthy();
       expect(scope.editDisabled).toBeTruthy();
       expect(scope.addActualTimeDisabled).toBeTruthy();
       expect(scope.cancelDisabled).toBeTruthy();
    });

    it("should disable move button when user selects surgical appointment but status is not Scheduled", function () {
       createController();
       scope.$emit("event:surgicalAppointmentSelect", {status: Bahmni.OT.Constants.completed}, {surgicalAppointments: []});
       expect(scope.moveButtonDisabled).toBeTruthy();
       expect(scope.editDisabled).toBeFalsy();
       expect(scope.addActualTimeDisabled).toBeFalsy();
       expect(scope.cancelDisabled).toBeTruthy();
    });

    it("should enable move button when user selects surgical appointment but status is Scheduled", function () {
       createController();
       scope.$emit("event:surgicalAppointmentSelect", {status: Bahmni.OT.Constants.scheduled}, {surgicalAppointments: []});
       expect(scope.moveButtonDisabled).toBeFalsy();
       expect(scope.editDisabled).toBeFalsy();
       expect(scope.addActualTimeDisabled).toBeFalsy();
       expect(scope.cancelDisabled).toBeFalsy();
    });

    it("should take stateParams viewDate when it is present", function () {
        stateParams.viewDate = new Date();
        createController();
        expect(scope.viewDate).toBe(stateParams.viewDate);
    });

    it("should appointmentList include 'postponed' and 'cancelled' status when user comes from surgical queues to listview", function () {
        state.view = 'List View';
        createController();
        expect(scope.appointmentStatusList.length).toEqual(4);
        expect(scope.appointmentStatusList).toEqual([{name: Bahmni.OT.Constants.scheduled}, {name: Bahmni.OT.Constants.completed},
            {name: Bahmni.OT.Constants.postponed}, {name: Bahmni.OT.Constants.cancelled}]);
    });
});
