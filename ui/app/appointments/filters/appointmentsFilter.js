'use strict';

angular.module('bahmni.appointments')
    .filter('appointments', [function () {
        var filterAppointmentsByService = function (appointments, serviceUuids) {
            return _.filter(appointments, function (appointment) {
                return appointment.service && _.includes(serviceUuids, appointment.service.uuid);
            });
        };

        var filterAppointmentsByServiceType = function (appointments, serviceTypeUuids) {
            return _.filter(appointments, function (appointment) {
                return appointment.serviceType && _.includes(serviceTypeUuids, appointment.serviceType.uuid);
            });
        };

//        var filterAppointmentsByProviders = function (appointments, providerUuids) {
//            if (_.isEmpty(providerUuids)) {
//                return appointments;
//            }
//            return _.filter(appointments, function (appointment) {
//                if (!appointment.provider) return _.includes(providerUuids, 'no-provider-uuid');
//                return appointment.provider && _.includes(providerUuids, appointment.provider.uuid);
//            });
//        };

        var filterAppointmentsByLocation = function (appointments, locationList) {
                    if (_.isEmpty(locationList)) {
                        return appointments;
                    }

                    return _.filter(appointments, function (appointment) {
                        return _.includes(locationList, appointment.location.uuid);
                    });
                };

        var filterAppointmentsByStatus = function (appointments, statusList) {
            if (_.isEmpty(statusList)) {
                return appointments;
            }
            return _.filter(appointments, function (appointment) {
                return _.includes(statusList, appointment.status);
            });
        };

        return function (appointments, filters) {
            if (_.isEmpty(filters)) {
                return appointments;
            }
            if ((_.isEmpty(filters.serviceUuids) && _.isEmpty(filters.serviceTypeUuids))) {
                var appointmentsFilteredByLocation = filterAppointmentsByLocation(appointments, filters.locationList);
                return filterAppointmentsByStatus(appointmentsFilteredByLocation, filters.statusList);
            }

            var appointmentsFilteredByService = filterAppointmentsByService(appointments, filters.serviceUuids);
            var appointmentsFilteredByServiceType = filterAppointmentsByServiceType(appointments, filters.serviceTypeUuids);
            var appointmentsFilteredBySpeciality = appointmentsFilteredByService.concat(appointmentsFilteredByServiceType);
            var appointmentsFilteredByLocation = filterAppointmentsByLocation(appointmentsFilteredBySpeciality, filters.locationList);
            return filterAppointmentsByStatus(appointmentsFilteredByLocation, filters.statusList);
        };
    }]);
