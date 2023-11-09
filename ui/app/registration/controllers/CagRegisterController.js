'use strict';

angular.module('bahmni.registration')
    .controller('CagRegisterController',['$rootScope', '$scope', '$location', '$window', 'spinner','ngDialog', 'patientAttributeService', 'appService',
    'messagingService', '$translate', '$filter', '$http', '$stateParams','addressHierarchyService', 'patientService', '$timeout', '$bahmniCookieStore','$q','observationsService','cagService',
        function ($rootScope, $scope, $location, $window, spinner, ngDialog, patientAttributeService, appService, messagingService, $translate, $filter, $http, $stateParams, addressHierarchyService, patientService, $timeout, $bahmniCookieStore,$q,observationsService,cagService) {
            $scope.isSubmitting = false;
            $scope.patientlist=[];
            // $scope.cagMembers=[];
            $scope.district="";
            $scope.constituency="";
            $scope.village="";
            $scope.uuid = "";
            $scope.cag = [];
            $scope.cag.cagPatientList=[];
            $scope.patientThis;// = "5a6f70be-19c2-442e-adf4-89e184abd039";

            var loginLocationUuid = $bahmniCookieStore.get(Bahmni.Common.Constants.locationCookieName);
            console.log("Location" ,loginLocationUuid);
            var visitLocationUuid = $rootScope.visitLocation;
            var defaultVisitType = $rootScope.regEncounterConfiguration.getDefaultVisitType(loginLocationUuid);
            $scope.Height;
        
            console.log(cagService.run());
            $scope.searchAddress = function(fieldName, query){
                var parentUuid = null;
                addressHierarchyService.search(fieldName, query, parentUuid)
                .then(function (response) {
                    // Handle the search results
                    $scope.addressResults = response.data;
                    console.log('Address Results:', $scope.addressResults);
                })
                .catch(function (error) {
                    // Handle errors
                    console.error('Error during address hierarchy search:', error);
                });
            }
            $scope.selectedIndices = [];
            $scope.unselectedIndices = [];

            $scope.updateSelectedPatients = function (index) {
                    var indexOfSelected = $scope.selectedIndices.indexOf(index);
                var indexOfUnselected = $scope.unselectedIndices.indexOf(index);
                console.log( " Selected  : ",$scope.unselectedIndices);
                console.log ("Not selected: ",$scope.selectedIndices);
                
                // if($scope.unselectedIndices.length == 0){
                //     for(let i=0;i<$scope.cag.cagListLength.size();i++){
                //   $scope.unselectedIndices.splice(i, 1);

                //     }
                // }

                if (indexOfSelected === -1 && indexOfUnselected === -1) {
                $scope.selectedIndices.push(index);
                } else if (indexOfSelected !== -1) {
                $scope.selectedIndices.splice(indexOfSelected, 1);
                $scope.unselectedIndices.push(index);
                } else {
                $scope.unselectedIndices.splice(indexOfUnselected, 1);
                $scope.selectedIndices.push(index);
                }
            };

            $scope.showResults=0;
            $scope.selectAddress = function(selectedAddress){
                console.log(selectedAddress)
                $scope.village=selectedAddress.name;
                $scope.constituency=selectedAddress.parent.name;
                $scope.district=selectedAddress.parent.parent.name;
                $scope.addressResults = [];
            }

            $scope.save = function(){
                $scope.isSubmitting = true;
                $scope.cagData={
                    "name": $scope.cag.name,
                    "description": $scope.cag.description,
                    "constituency": $scope.constituency,
                    "village": $scope.village,
                    "district": $scope.district+""
                }
                console.log(($scope.cagData));
                var apiUrl = Bahmni.Registration.Constants.baseOpenMRSRESTURL+'/cag';
                if($location.path!="/cag/new"){
                    apiUrl = Bahmni.Registration.Constants.baseOpenMRSRESTURL+'/cag/'+$scope.uuid;
                    console.log(apiUrl);
                }

                $http({
                    url: apiUrl,
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    data: angular.toJson($scope.cagData)
                }).then(function(response){
                    console.log(response);
                    if(response.status==200 || response.status==201){
                        $location.url('/cag/'+response.data.uuid);
                        messagingService.showMessage('info', 'Saved');
                    }
                    $scope.isSubmitting = false;
                })
                
            }

            
            $scope.clearAddressResults = function() {
                $timeout(function() {
                    if($scope.village!='' && $scope.district!='' && $scope.constituency!='')
                    $scope.addressResults = [];
                }, 500);
            };

            $scope.clearPatientResults = function () {
                $timeout(function() {$scope.patientResults = [];}, 500);
            }

            $scope.searchPatient = function(fieldPatient){
                var apiUrl1 = Bahmni.Registration.Constants.baseOpenMRSRESTURL+'/patient?q='+fieldPatient+'&limit=10';            
                $http.get(apiUrl1)
                .then(function(response) {
                    // Handle the successful response here
                    $scope.patientResults=response.data.results;
                })
                .catch(function(error) {
                    // Handle any errors that occurred during the request
                    alert('API Error:', error);
                });
            }
             
            $scope.patientTobeAdded={};
            
            $scope.selectPatient = function(selectedPatient){
                $scope.patientTobeAdded=selectedPatient;
                $scope.newPatient = $scope.patientTobeAdded.display;
                $scope.patientResults=[];
            }

            $scope.searchCagList = function(key, cagListLength){
                for (let i = 0; i < cagListLength; i++) {
                    if(key == $scope.cag.cagPatientList[i].uuid){
                        return 1
                    }
                }
                return 0;
            }

            $scope.openPatientDashboardInNewTab = function (cagMember) {
                // var personRelatedTo = getPersonRelatedTo(cagMember);
                console.log(getPatientRegistrationUrl(cagMember.uuid));
                $window.open(getPatientRegistrationUrl(cagMember.uuid), '_blank');
            };

            var getPatientRegistrationUrl = function (patientUuid) {
                return '#/patient/' + patientUuid;
            };

            $scope.addPatientToCag = function(patientTobeAdded, cagListLength){
                console.log(patientTobeAdded);
                if(cagListLength==undefined) cagListLength=0;
                if(JSON.stringify($scope.patientTobeAdded) != '{}' && $scope.searchCagList(patientTobeAdded.uuid,cagListLength)==0){
                    var data={
                        "cagUuid": $scope.uuid+"",
                        "uuid": patientTobeAdded.uuid+""
                    }
                    console.log(data);
                    apiUrl = Bahmni.Registration.Constants.baseOpenMRSRESTURL+'/cagPatient';

                    $http({
                        url: apiUrl,
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        data: angular.toJson(data)
                    }).then(function(response){
                        if((response.status==200 || response.status==201) && $scope.cag.cagPatientList!=null){
                            $scope.cag.cagPatientList.push($scope.patientTobeAdded);
                            $scope.patientTobeAdded = {};
                            $scope.newPatient = '';
                            messagingService.showMessage('info', 'Patient has been added to CAG');
                        }
                        else{
                            messagingService.showMessage('error', response.error.message);
                        }
                        $scope.isSubmitting = false;
                    })
                    
                }
                else{
                    alert('No selected Patient Or patient already on list...');
                }
            }

            $scope.deletePatientFromCag = function(patientTobeRemoved, patientindex){
                console.log(patientindex);
                apiUrl = Bahmni.Registration.Constants.baseOpenMRSRESTURL+'/cagPatient/'+patientTobeRemoved.uuid;
                $http.delete(apiUrl)
                .then(function(response){
                    console.log(response);
                    if(response.status==204){
                        $scope.cag.cagPatientList.splice(patientindex, 1);
                        messagingService.showMessage('info', 'Patient has been removed from CAG');
                    }
                    else{
                        messagingService.showMessage('error', 'Errror while removing patient from CAG');
                    }
                    $scope.isSubmitting = false;
                })
            }
            
            var getConceptValues = function () {
                return $q.all([
                    observationsService.fetch("580d4b70-9593-481a-9fe6-3a721fb56184", [
                        "HEIGHT"
                    ],"latest")
                ]);
            };
           console.log(getConceptValues());

            getConceptValues().then(function (result) {
                var heightConcept = _.find(result[0].data, function (observation) {
                    return observation.concept.name === "Height";
                });
                console.log(heightConcept);
                console.log(result);
                try {
                    $scope.Height = result[0].data[0].value;
                } catch (error) {
                    
                }
            });

            $scope.patientsToBeStartedVisits = []; 
            $scope.patientsNotBeStartedVisits = [];
            $scope.visitUuids = [];

            $scope.startVisit = function(){
                let length = 0;

                for(let selectedPatient in $scope.selectedIndices){
                    length++;
                    // console.log("Buttons buttons", $scope.selectedIndices);
                    for(let patient in $scope.cag.cagPatientList){
                        // console.log("Selected patient Index : ", patient);//   
                        if(selectedPatient == patient){
                            $scope.patientsToBeStartedVisits.push($scope.cag.cagPatientList[$scope.selectedIndices[selectedPatient]]);
                            console.log("uuid : ", $scope.patientsToBeStartedVisits[selectedPatient].uuid);
                        }
                    }
                }
                console.log(length);
                $scope.visitUuids = [length];
                for(let i =0;i<length;i++){
                    // $scope.visitUuids.push()
                    $scope.visitUuids[i] = $scope.patientsToBeStartedVisits[i].uuid;

                }

                console.log("another : ", $scope.visitUuids);
                for(let visisPatients in $scope.cag.cagPatientList){
                    if(!Object.values($scope.patientsToBeStartedVisits).includes($scope.cag.cagPatientList[visisPatients])){
                        $scope.patientsNotBeStartedVisits.push($scope.cag.cagPatientList[visisPatients]);
                        console.log("This Not visit : ", $scope.cag.cagPatientList[visisPatients].uuid);
                    }
                }
 
                console.log("Cag Patients : ",$scope.cag.cagPatientList);
                console.log("Patients that should not be stated visits ",$scope.patientsNotBeStartedVisits);
                console.log("Patients to start visit: ",$scope.patientsToBeStartedVisits);
                console.log("First patient :",$scope.patientsToBeStartedVisits[0]);
                console.log("Second patient : ",$scope.patientsToBeStartedVisits[1]);


                for(let numberOfUuids in  $scope.visitUuids){

                    // Generate the current date and time
                    const currentDate = new Date();
                    const dateStarted = currentDate.toISOString().slice(0, 19).replace("T", " ");
                    const cagUuid = $scope.uuid;
                    
                    const patientUuid = $scope.visitUuids[numberOfUuids];//$scope.patientsToBeStartedVisits[numberOfPatient].uuid;//$scope.cag.cagPatientList[$scope.patientsToBeStartedVisits[numberOfPatient]].uuid;
                    // console.log("index of seleected button : ", $scope.patientsToBeStartedVisits[numberOfPatient]);
                    console.log ("visit opened for : " ,patientUuid);
                    // console.log ("number of patients : " , numberOfPatient);

                    const locationUuid = "8d6c993e-c2cc-11de-8d13-0010c6dffd0f";                                                                                                                                
                    const encounterType = "81888515-3f10-11e4-adec-0800271c1b75";
                    const encounterDatetime = "2023-10-12 03:32:46";
                    const conceptUuid = "9b1fa8e6-8209-4fcd-abd2-142887fc83e0";
                    const valueCoded = "a3e3fdfe-e03c-401d-a3fd-1c2553fefe53";
                    const valueCodedName = "HTC, Patient";
                    const valueNumeric  = 140;//$scope.Height;
                    console.log($scope.Height);
                    const absenteesObj = {
                        "b2a35126-d007-4a90-8859-f41f55ed980c": "Went to Bloemfontein"
                    };
                    //const locationName = "Unknown Location";

                    // Build the JSON data
                    const data = {
                        "cag": {
                            "uuid": cagUuid
                        },
                        "dateStarted": dateStarted,
                        "attenderVisit": {
                            "patient": {
                                "uuid": patientUuid
                            },
                            "location": {
                                "uuid": locationUuid
                            },
                            "encounters": [
                                {
                                    "encounterType": encounterType,
                                    "encounterDatetime": encounterDatetime,
                                    "patient": {
                                        "uuid": patientUuid
                                    },
                                    "location": {
                                        "uuid": locationUuid
                                    },
                                    "obs": [
                                        {
                                            "concept": {
                                                "uuid": conceptUuid
                                            },
                                            "valueCoded": valueCoded,
                                            "valueCodedName": valueCodedName
                                        },
                                        {
                                            "concept": {
                                                "uuid": "5090AAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                                            },
                                            "valueNumeric": valueNumeric
                                        }
                                    ]
                                }
                            ]
                        },
                        "absentees": absenteesObj,
                        "locationName": "ART/TB Clinic"
                    };
                    
                    console.log(data);
                    apiUrl = Bahmni.Registration.Constants.baseOpenMRSRESTURL+'/cagVisit/';
                    $http({
                        url: apiUrl,
                        method: 'POST',
                        headers: {
                        'Content-Type': 'application/json'
                        },
                        data: angular.toJson(data)
                    }).then(function(response){
                        messagingService.showMessage('info', 'Visits Opened ! !');
                    })
                }
                // $scope.patientsToBeStartedVisits = [];
            }

            $scope.fetchCag = function(url) {
                $http.get(apiUrl)
                .then(function(response) {
                    // Handle the successful response here
                    console.log('API Response:', response);
                    $scope.cag = response.data;
                    $scope.village=$scope.cag.village;
                    $scope.constituency=$scope.cag.constituency;
                    $scope.district=$scope.cag.district;
                })
                .catch(function(error) {
                    // Handle any errors that occurred during the request
                    console.error('API Error:', error);
                });
            }
            
            if($location.path()!='/cag/new'){
                $scope.uuid = $stateParams.cagUuid;
                console.log("state: "+$stateParams.cagUuid);
                console.log($location.path());
                var apiUrl = Bahmni.Registration.Constants.baseOpenMRSRESTURL+'/cag/'+$scope.uuid;
                $scope.fetchCag(apiUrl);
            }


            
            
        }
    ]);